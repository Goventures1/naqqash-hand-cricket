const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ ok: true, rooms: rooms.size, uptime: Math.floor(process.uptime()) });
});

app.get('/Naqqash.apk', (req, res) => {
  res.download(path.join(__dirname, 'Naqqash.apk'), 'Naqqash.apk');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rooms State storage
// Room code -> { code, hostId, team1: { name, players: [] }, team2: { name, players: [] }, spectators: [], settings: {...}, state: {...} }
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getPublicRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    team1: {
      name: room.team1.name,
      players: room.team1.players.map(p => ({ id: p.id, name: p.name, score: p.score || 0, balls: p.balls || 0, isOut: !!p.isOut })),
      score: room.team1.score,
      wickets: room.team1.wickets,
      overs: room.team1.overs,
      balls: room.team1.balls
    },
    team2: {
      name: room.team2.name,
      players: room.team2.players.map(p => ({ id: p.id, name: p.name, score: p.score || 0, balls: p.balls || 0, isOut: !!p.isOut })),
      score: room.team2.score,
      wickets: room.team2.wickets,
      overs: room.team2.overs,
      balls: room.team2.balls
    },
    spectators: room.spectators.map(s => ({ id: s.id, name: s.name })),
    settings: room.settings,
    gamePhase: room.gamePhase, // 'lobby', 'toss', 'playing', 'innings_break', 'match_over'
    toss: room.toss,
    currentInnings: room.currentInnings, // 1 or 2
    battingTeamKey: room.battingTeamKey, // 'team1' or 'team2'
    bowlingTeamKey: room.bowlingTeamKey, // 'team1' or 'team2'
    target: room.target,
    currentBatsmanIndex: room.currentBatsmanIndex,
    currentBowlerIndex: room.currentBowlerIndex,
    currentBatsman: room.currentBatsman,
    currentBowler: room.currentBowler,
    lastBallResult: room.lastBallResult,
    hasBatPicked: room.pendingPicks ? !!room.pendingPicks.batMove : false,
    hasBowlPicked: room.pendingPicks ? !!room.pendingPicks.bowlMove : false,
    commentary: room.commentary || [],
    winner: room.winner
  };
}

io.on('connection', (socket) => {
  let userRoomCode = null;
  console.log(`⚡ [${new Date().toLocaleTimeString()}] Client connected: ${socket.id}`);

  socket.on('create_room', ({ playerName, team1Name, team2Name, maxOvers }) => {
    const code = generateRoomCode();
    console.log(`🏠 [${new Date().toLocaleTimeString()}] Room CREATED: ${code} by ${playerName || 'Anonymous'}`);
    const room = {
      code,
      hostId: socket.id,
      team1: {
        name: team1Name || 'Naqqash Tigers 🐯',
        players: [{ id: socket.id, name: playerName || 'Player 1', score: 0, balls: 0, isOut: false }],
        score: 0,
        wickets: 0,
        balls: 0,
        overs: 0
      },
      team2: {
        name: team2Name || 'Challengers 🏏',
        players: [],
        score: 0,
        wickets: 0,
        balls: 0,
        overs: 0
      },
      spectators: [],
      settings: {
        maxOvers: parseInt(maxOvers) || 2, // 2 overs default, can be 1, 2, 5, etc.
        ballsPerOver: 6
      },
      gamePhase: 'lobby',
      toss: null,
      currentInnings: 1,
      battingTeamKey: 'team1',
      bowlingTeamKey: 'team2',
      target: null,
      currentBatsmanIndex: 0,
      currentBowlerIndex: 0,
      currentBatsman: null,
      currentBowler: null,
      pendingPicks: { batMove: null, bowlMove: null },
      lastBallResult: null,
      commentary: ['Room created! Welcome to Naqqash Hand Cricket!'],
      winner: null
    };

    rooms.set(code, room);
    userRoomCode = code;
    socket.join(code);

    socket.emit('room_created', { room: getPublicRoomState(room), myRole: 'team1' });
  });

  socket.on('join_room', ({ code, playerName, role }) => {
    code = (code || '').toUpperCase().trim();
    console.log(`🚪 [${new Date().toLocaleTimeString()}] Join attempt: Room=${code}, Player=${playerName}, Role=${role}. Active rooms: [${Array.from(rooms.keys()).join(', ')}]`);
    const room = rooms.get(code);

    if (!room) {
      console.log(`❌ [${new Date().toLocaleTimeString()}] Room NOT found: ${code}`);
      return socket.emit('error_msg', `Room "${code}" not found! Active rooms: [${Array.from(rooms.keys()).join(', ') || 'None'}]`);
    }

    userRoomCode = code;
    socket.join(code);

    const userObj = { id: socket.id, name: playerName || `Cousin ${Math.floor(Math.random() * 100)}` };

    if (role === 'team1') {
      room.team1.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
    } else if (role === 'team2') {
      room.team2.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
    } else {
      room.spectators.push(userObj);
      role = 'spectator';
    }

    room.commentary.unshift(`👀 ${userObj.name} joined as ${role === 'spectator' ? 'Spectator' : (role === 'team1' ? room.team1.name : room.team2.name)}`);
    io.to(code).emit('room_updated', { room: getPublicRoomState(room) });
    socket.emit('joined_successfully', { room: getPublicRoomState(room), myRole: role });
  });

  socket.on('switch_role', ({ newRole }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gamePhase !== 'lobby') return;

    let userName = 'Cousin';
    // Remove from existing
    const inT1 = room.team1.players.findIndex(p => p.id === socket.id);
    if (inT1 !== -1) {
      userName = room.team1.players[inT1].name;
      room.team1.players.splice(inT1, 1);
    }
    const inT2 = room.team2.players.findIndex(p => p.id === socket.id);
    if (inT2 !== -1) {
      userName = room.team2.players[inT2].name;
      room.team2.players.splice(inT2, 1);
    }
    const inSpec = room.spectators.findIndex(s => s.id === socket.id);
    if (inSpec !== -1) {
      userName = room.spectators[inSpec].name;
      room.spectators.splice(inSpec, 1);
    }

    const userObj = { id: socket.id, name: userName };
    if (newRole === 'team1') room.team1.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
    else if (newRole === 'team2') room.team2.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
    else {
      newRole = 'spectator';
      room.spectators.push(userObj);
    }

    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
    socket.emit('role_switched', { myRole: newRole });
  });

  socket.on('update_teams', ({ team1Name, team2Name, maxOvers }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.hostId !== socket.id) return;

    if (team1Name) room.team1.name = team1Name.trim();
    if (team2Name) room.team2.name = team2Name.trim();
    if (maxOvers) room.settings.maxOvers = parseInt(maxOvers) || 2;

    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  // START TOSS
  socket.on('start_toss', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.hostId !== socket.id) return;

    if (room.team1.players.length === 0 || room.team2.players.length === 0) {
      return socket.emit('error_msg', 'Both teams need at least 1 player to play!');
    }

    room.gamePhase = 'toss';
    room.toss = {
      callingTeam: 'team2',
      callingTeamName: room.team2.name,
      coinState: 'flipping',
      winnerKey: null,
      decision: null
    };

    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  socket.on('call_toss', ({ choice }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gamePhase !== 'toss') return;

    const tossResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice === tossResult;
    const winnerKey = won ? 'team2' : 'team1';

    room.toss.coinResult = tossResult;
    room.toss.winnerKey = winnerKey;
    room.toss.winnerName = room[winnerKey].name;
    room.toss.coinState = 'done';
    room.commentary.unshift(`🪙 Toss result is ${tossResult.toUpperCase()}! ${room[winnerKey].name} won the toss!`);

    io.to(userRoomCode).emit('toss_completed', {
      tossResult,
      winnerKey,
      winnerName: room[winnerKey].name,
      room: getPublicRoomState(room)
    });
  });

  socket.on('choose_toss_decision', ({ decision }) => { // 'bat' or 'bowl'
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gamePhase !== 'toss' || !room.toss.winnerKey) return;

    room.toss.decision = decision;
    const winnerKey = room.toss.winnerKey;
    const otherKey = winnerKey === 'team1' ? 'team2' : 'team1';

    if (decision === 'bat') {
      room.battingTeamKey = winnerKey;
      room.bowlingTeamKey = otherKey;
    } else {
      room.battingTeamKey = otherKey;
      room.bowlingTeamKey = winnerKey;
    }

    room.gamePhase = 'playing';
    room.currentInnings = 1;
    room.currentBatsmanIndex = 0;
    room.currentBowlerIndex = 0;
    updateActivePlayers(room);

    room.commentary.unshift(`🏏 ${room[winnerKey].name} chose to ${decision.toUpperCase()} first! Match starting!`);
    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  function updateActivePlayers(room) {
    const batTeam = room[room.battingTeamKey];
    const bowlTeam = room[room.bowlingTeamKey];

    // Find first batsman not out
    let bIdx = batTeam.players.findIndex(p => !p.isOut);
    if (bIdx === -1) bIdx = 0;
    room.currentBatsmanIndex = bIdx;
    room.currentBatsman = batTeam.players[bIdx] || null;

    // Bowler rotates or stays
    room.currentBowlerIndex = room.currentBowlerIndex % (bowlTeam.players.length || 1);
    room.currentBowler = bowlTeam.players[room.currentBowlerIndex] || null;
  }

  // PLAYER MOVE: 1, 2, 3, 4, 5, 6 (👍), 10 (👊)
  socket.on('play_move', ({ move }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gamePhase !== 'playing' || room.isTransitioning) return;

    move = parseInt(move);
    if (![1, 2, 3, 4, 5, 6, 10].includes(move)) return;

    // Check if batsman or bowler
    const isBatsman = room.currentBatsman && room.currentBatsman.id === socket.id;
    const isBowler = room.currentBowler && room.currentBowler.id === socket.id;

    if (!isBatsman && !isBowler) {
      return; // Not your turn to play
    }

    if (isBatsman) {
      room.pendingPicks.batMove = move;
    }
    if (isBowler) {
      room.pendingPicks.bowlMove = move;
    }

    // Notify room someone has locked their pick (without revealing what it is!)
    io.to(userRoomCode).emit('pick_locked', {
      hasBatPicked: !!room.pendingPicks.batMove,
      hasBowlPicked: !!room.pendingPicks.bowlMove
    });

    // When both have picked -> REVEAL BALL!
    if (room.pendingPicks.batMove !== null && room.pendingPicks.bowlMove !== null) {
      evaluateBall(room);
    }
  });

  function evaluateBall(room) {
    const batMove = room.pendingPicks.batMove;
    const bowlMove = room.pendingPicks.bowlMove;
    const batTeam = room[room.battingTeamKey];
    const bowlTeam = room[room.bowlingTeamKey];
    const batsman = room.currentBatsman;
    const bowler = room.currentBowler;
    const batsmanName = batsman ? batsman.name : 'Batsman';
    const bowlerName = bowler ? bowler.name : 'Bowler';

    // Reset pending
    room.pendingPicks = { batMove: null, bowlMove: null };

    batTeam.balls++;
    const ballsInOver = batTeam.balls % 6;
    batTeam.overs = Math.floor(batTeam.balls / 6) + (ballsInOver / 10);
    if (batsman) batsman.balls = (batsman.balls || 0) + 1;

    let isOut = false;
    let runsScored = 0;
    let commentaryMsg = '';
    let pendingTransition = null;

    if (batMove === bowlMove) {
      // OUT!
      isOut = true;
      batTeam.wickets++;
      if (batsman) batsman.isOut = true;

      const outDesc = batMove === 6 ? 'THUMBS UP CAUGHT! 🔴' : (batMove === 10 ? 'PUNCH BLOCKED & BOWLED! 🔴' : 'OUT! 🔴');
      commentaryMsg = `☝️ ${batsmanName} is OUT! ${batsmanName}: ${batMove}, ${bowlerName}: ${bowlMove} (${outDesc})`;

      room.lastBallResult = {
        batMove,
        bowlMove,
        batsmanName,
        bowlerName,
        isOut: true,
        runs: 0,
        text: 'OUT! 🔴'
      };

      // Check if all out
      const remainingBatsmen = batTeam.players.filter(p => !p.isOut);
      if (remainingBatsmen.length === 0) {
        pendingTransition = () => handleInningsEnd(room, 'All out!');
      } else {
        // Next batsman
        updateActivePlayers(room);
      }
    } else {
      // RUNS SCORED
      runsScored = batMove;
      batTeam.score += runsScored;
      if (batsman) batsman.score = (batsman.score || 0) + runsScored;

      let cheerText = `+${runsScored} Runs`;
      if (batMove === 6) cheerText = 'SIX! 👍 Huge Sixer!';
      else if (batMove === 10) cheerText = 'SUPER PUNCH 10! 👊 Boom!';

      commentaryMsg = `🏏 ${batsmanName} showed ${batMove}, ${bowlerName} showed ${bowlMove}. ${cheerText}`;

      room.lastBallResult = {
        batMove,
        bowlMove,
        batsmanName,
        bowlerName,
        isOut: false,
        runs: runsScored,
        text: cheerText
      };

      // Check if target chased in 2nd innings
      if (room.currentInnings === 2 && room.target && batTeam.score >= room.target) {
        pendingTransition = () => handleMatchEnd(room, `${batTeam.name} chased the target and WON the match! 🏆`);
      }
    }

    room.commentary.unshift(commentaryMsg);

    // Check overs completion if not already transitioning
    const maxBalls = room.settings.maxOvers * 6;
    if (!pendingTransition && batTeam.balls >= maxBalls) {
      pendingTransition = () => handleInningsEnd(room, `Overs completed (${room.settings.maxOvers} overs)!`);
    }

    // Bowler rotation every over if continuing
    if (!pendingTransition && batTeam.balls % 6 === 0) {
      room.currentBowlerIndex = (room.currentBowlerIndex + 1) % (bowlTeam.players.length || 1);
      updateActivePlayers(room);
      room.commentary.unshift(`🔄 End of Over ${Math.floor(batTeam.balls / 6)}! Bowler changed.`);
    }

    if (pendingTransition) {
      room.isTransitioning = true;
    }

    // ALWAYS reveal the hands of this ball first so everyone sees who picked what!
    io.to(room.code).emit('ball_completed', {
      room: getPublicRoomState(room),
      result: room.lastBallResult
    });

    if (pendingTransition) {
      setTimeout(() => {
        if (!rooms.has(room.code)) return;
        room.isTransitioning = false;
        pendingTransition();
      }, 2800);
    }
  }

  function handleInningsEnd(room, reason) {
    if (room.currentInnings === 1) {
      room.gamePhase = 'innings_break';
      room.target = room[room.battingTeamKey].score + 1;
      room.commentary.unshift(`🔔 Innings 1 Over (${reason})! Target: ${room.target} runs for ${room[room.bowlingTeamKey].name}!`);

      io.to(room.code).emit('innings_ended', {
        room: getPublicRoomState(room),
        target: room.target
      });

      // Switch batting & bowling after brief break
      setTimeout(() => {
        if (!rooms.has(room.code)) return;
        const oldBatKey = room.battingTeamKey;
        room.battingTeamKey = room.bowlingTeamKey;
        room.bowlingTeamKey = oldBatKey;
        room.currentInnings = 2;
        room.gamePhase = 'playing';
        room.currentBatsmanIndex = 0;
        room.currentBowlerIndex = 0;
        updateActivePlayers(room);
        room.commentary.unshift(`🚀 2nd Innings Started! Need ${room.target} runs to win!`);
        io.to(room.code).emit('room_updated', { room: getPublicRoomState(room) });
      }, 4000);
    } else {
      // 2nd innings ended
      const batTeam = room[room.battingTeamKey];
      const bowlTeam = room[room.bowlingTeamKey];
      if (batTeam.score >= room.target) {
        handleMatchEnd(room, `${batTeam.name} WON by ${batTeam.players.length - batTeam.wickets} wickets! 🏆`);
      } else if (batTeam.score === room.target - 1) {
        handleMatchEnd(room, `MATCH TIED! 🤝 What an incredible thriller!`);
      } else {
        const diff = (room.target - 1) - batTeam.score;
        handleMatchEnd(room, `${bowlTeam.name} WON by ${diff} runs! 🏆`);
      }
    }
  }

  function handleMatchEnd(room, summary) {
    room.gamePhase = 'match_over';
    room.winner = summary;
    room.commentary.unshift(`🏁 MATCH FINISHED: ${summary}`);
    io.to(room.code).emit('match_finished', {
      room: getPublicRoomState(room),
      summary
    });
  }

  // LIVE REACTIONS / EMOJIS (from spectators or players)
  socket.on('send_reaction', ({ emoji, senderName }) => {
    if (!userRoomCode) return;
    io.to(userRoomCode).emit('live_reaction', {
      emoji: emoji || '🔥',
      senderName: senderName || 'Cousin'
    });
  });

  // LEAVE ROOM (Back button)
  socket.on('leave_room', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    socket.leave(userRoomCode);
    const prevCode = userRoomCode;
    userRoomCode = null;

    if (!room) return;
    let leaverName = 'A user';
    const p1 = room.team1.players.find(p => p.id === socket.id);
    const p2 = room.team2.players.find(p => p.id === socket.id);
    const spec = room.spectators.find(s => s.id === socket.id);
    if (p1) leaverName = p1.name;
    else if (p2) leaverName = p2.name;
    else if (spec) leaverName = spec.name;

    room.team1.players = room.team1.players.filter(p => p.id !== socket.id);
    room.team2.players = room.team2.players.filter(p => p.id !== socket.id);
    room.spectators = room.spectators.filter(s => s.id !== socket.id);

    if (room.team1.players.length === 0 && room.team2.players.length === 0 && room.spectators.length === 0) {
      rooms.delete(prevCode);
    } else {
      if (room.hostId === socket.id) {
        const nextUser = room.team1.players[0] || room.team2.players[0] || room.spectators[0];
        if (nextUser) room.hostId = nextUser.id;
      }
      room.commentary.unshift(`🚪 ${leaverName} left the match.`);
      io.to(prevCode).emit('room_updated', { room: getPublicRoomState(room) });
    }
  });

  // REMATCH / RESTART
  socket.on('restart_match', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.hostId !== socket.id) return;

    // Reset scores & players status
    room.team1.score = 0;
    room.team1.wickets = 0;
    room.team1.balls = 0;
    room.team1.overs = 0;
    room.team1.players.forEach(p => { p.score = 0; p.balls = 0; p.isOut = false; });

    room.team2.score = 0;
    room.team2.wickets = 0;
    room.team2.balls = 0;
    room.team2.overs = 0;
    room.team2.players.forEach(p => { p.score = 0; p.balls = 0; p.isOut = false; });

    room.target = null;
    room.isTransitioning = false;
    room.gamePhase = 'lobby';
    room.toss = null;
    room.winner = null;
    room.lastBallResult = null;
    room.pendingPicks = { batMove: null, bowlMove: null };
    room.commentary.unshift('🔄 Match reset for a new game!');

    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room) return;

    // Remove user
    room.team1.players = room.team1.players.filter(p => p.id !== socket.id);
    room.team2.players = room.team2.players.filter(p => p.id !== socket.id);
    room.spectators = room.spectators.filter(s => s.id !== socket.id);

    // If room is empty, delete
    if (room.team1.players.length === 0 && room.team2.players.length === 0 && room.spectators.length === 0) {
      rooms.delete(userRoomCode);
    } else {
      // Reassign host if host left
      if (room.hostId === socket.id) {
        const nextUser = room.team1.players[0] || room.team2.players[0] || room.spectators[0];
        if (nextUser) room.hostId = nextUser.id;
      }
      io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🐅 NAQQASH Hand Cricket Server is running on port ${PORT}`);
  console.log(`👉 Access on local network: http://localhost:${PORT}`);
});
