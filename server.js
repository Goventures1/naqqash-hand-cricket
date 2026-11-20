const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const userManager = require('./userManager');
const ludoEngine = require('./ludoEngine');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ ok: true, rooms: rooms.size, uptime: Math.floor(process.uptime()), platform: 'Naqqash Multi-Game Arena' });
});

app.get('/Naqqash.apk', (req, res) => {
  res.download(path.join(__dirname, 'Naqqash.apk'), 'Naqqash.apk');
});

app.get('/Naqqash-Cloud-Deploy.zip', (req, res) => {
  res.download(path.join(__dirname, 'Naqqash-Hand-Cricket-Cloud.zip'), 'Naqqash-Cloud-Deploy.zip');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rooms Map: roomCode -> roomObject
const rooms = new Map();

// 30 distinct high-contrast vibrant colors for players
const PLAYER_PALETTE = [
  { name: 'Electric Cyan', hex: '#00f0ff', bg: 'rgba(0, 240, 255, 0.25)' },
  { name: 'Neon Emerald', hex: '#10b981', bg: 'rgba(16, 185, 129, 0.25)' },
  { name: 'Royal Purple', hex: '#a855f7', bg: 'rgba(168, 85, 247, 0.25)' },
  { name: 'Sunset Amber', hex: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)' },
  { name: 'Crimson Rose', hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.25)' },
  { name: 'Vivid Blue', hex: '#3b82f6', bg: 'rgba(59, 130, 246, 0.25)' },
  { name: 'Lime Volt', hex: '#84cc16', bg: 'rgba(132, 204, 22, 0.25)' },
  { name: 'Hot Coral', hex: '#fb7185', bg: 'rgba(251, 113, 133, 0.25)' },
  { name: 'Deep Indigo', hex: '#6366f1', bg: 'rgba(99, 102, 241, 0.25)' },
  { name: 'Teal Flare', hex: '#14b8a6', bg: 'rgba(20, 184, 166, 0.25)' },
  { name: 'Tangerine', hex: '#f97316', bg: 'rgba(249, 115, 22, 0.25)' },
  { name: 'Magenta Pink', hex: '#ec4899', bg: 'rgba(236, 72, 153, 0.25)' },
  { name: 'Bright Gold', hex: '#eab308', bg: 'rgba(234, 179, 8, 0.25)' },
  { name: 'Mint Green', hex: '#34d399', bg: 'rgba(52, 211, 153, 0.25)' },
  { name: 'Violet Beam', hex: '#c084fc', bg: 'rgba(192, 132, 252, 0.25)' },
  { name: 'Sky Blue', hex: '#38bdf8', bg: 'rgba(56, 189, 248, 0.25)' },
  { name: 'Ruby Flame', hex: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)' },
  { name: 'Aquamarine', hex: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.25)' },
  { name: 'Copper Orange', hex: '#ea580c', bg: 'rgba(234, 88, 12, 0.25)' },
  { name: 'Lavender', hex: '#d8b4fe', bg: 'rgba(216, 180, 254, 0.25)' },
  { name: 'Spring Jade', hex: '#059669', bg: 'rgba(5, 150, 105, 0.25)' },
  { name: 'Turquoise', hex: '#06b6d4', bg: 'rgba(6, 182, 212, 0.25)' },
  { name: 'Cherry Red', hex: '#e11d48', bg: 'rgba(225, 29, 72, 0.25)' },
  { name: 'Bright Yellow', hex: '#facc15', bg: 'rgba(250, 204, 21, 0.25)' },
  { name: 'Royal Violet', hex: '#7c3aed', bg: 'rgba(124, 58, 237, 0.25)' },
  { name: 'Ocean Cyan', hex: '#0284c7', bg: 'rgba(2, 132, 199, 0.25)' },
  { name: 'Emerald Gem', hex: '#15803d', bg: 'rgba(21, 128, 61, 0.25)' },
  { name: 'Bronze Gold', hex: '#d97706', bg: 'rgba(217, 119, 6, 0.25)' },
  { name: 'Scarlet', hex: '#b91c1c', bg: 'rgba(185, 28, 28, 0.25)' },
  { name: 'Cyber Blue', hex: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.25)' }
];

// Snake & Ladders Board Constants
const SNAKE_LADDERS = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

const SNAKE_SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 10 // THE GIANT 99 TITAN COBRA!
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format public room state for client consumption
function getPublicRoomState(room) {
  if (!room) return null;
  const base = {
    code: room.code,
    hostId: room.hostId,
    gameType: room.gameType || 'snake', // 'snake', 'cricket', 'ludo'
    gamePhase: room.gamePhase, // 'lobby', 'playing', 'match_over', etc.
    betAmount: room.betAmount || 0,
    pot: room.pot || 0,
    spectators: room.spectators.map(s => ({ id: s.id, name: s.name, avatar: s.avatar })),
    commentary: room.commentary || [],
    createdAt: room.createdAt,
    winner: room.winner,
    lastLoser: room.lastLoser || null
  };

  if (room.gameType === 'snake') {
    base.snakeState = {
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        username: p.username,
        avatar: p.avatar,
        color: p.color,
        position: p.position,
        isLocked: p.isLocked,
        hasFinished: p.hasFinished,
        finishRank: p.finishRank,
        totalRolls: p.totalRolls || 0,
        laddersClimbed: p.laddersClimbed || 0,
        snakesBitten: p.snakesBitten || 0,
        hitGiant99: p.hitGiant99 || false
      })),
      turnIndex: room.snakeState ? room.snakeState.turnIndex : 0,
      activePlayerId: room.snakeState ? getActiveSnakePlayerId(room) : null,
      lastRoll: room.snakeState ? room.snakeState.lastRoll : null,
      lastEvent: room.snakeState ? room.snakeState.lastEvent : null,
      winners: room.snakeState ? room.snakeState.winners : [],
      lastLoser: room.snakeState ? room.snakeState.lastLoser : null,
      gameStartTime: room.snakeState ? room.snakeState.gameStartTime : null
    };
  } else if (room.gameType === 'ludo') {
    base.ludoState = room.ludoState || null;
  }

  // Always include cricket fields
  base.team1 = {
    name: room.team1 ? room.team1.name : 'Team 1',
    players: room.team1 ? room.team1.players.map(p => ({ id: p.id, name: p.name, username: p.username, score: p.score || 0, balls: p.balls || 0, isOut: !!p.isOut })) : [],
    score: room.team1 ? room.team1.score : 0,
    wickets: room.team1 ? room.team1.wickets : 0,
    overs: room.team1 ? room.team1.overs : 0,
    balls: room.team1 ? room.team1.balls : 0
  };
  base.team2 = {
    name: room.team2 ? room.team2.name : 'Team 2',
    players: room.team2 ? room.team2.players.map(p => ({ id: p.id, name: p.name, username: p.username, score: p.score || 0, balls: p.balls || 0, isOut: !!p.isOut })) : [],
    score: room.team2 ? room.team2.score : 0,
    wickets: room.team2 ? room.team2.wickets : 0,
    overs: room.team2 ? room.team2.overs : 0,
    balls: room.team2 ? room.team2.balls : 0
  };
  base.settings = room.settings || { maxOvers: 2, ballsPerOver: 6 };
  base.toss = room.toss || null;
  base.currentInnings = room.currentInnings || 1;
  base.battingTeamKey = room.battingTeamKey || 'team1';
  base.bowlingTeamKey = room.bowlingTeamKey || 'team2';
  base.target = room.target || null;
  base.currentBatsmanIndex = room.currentBatsmanIndex || 0;
  base.currentBowlerIndex = room.currentBowlerIndex || 0;
  base.currentBatsman = room.currentBatsman || null;
  base.currentBowler = room.currentBowler || null;
  base.lastBallResult = room.lastBallResult || null;
  base.hasBatPicked = room.pendingPicks ? !!room.pendingPicks.batMove : false;
  base.hasBowlPicked = room.pendingPicks ? !!room.pendingPicks.bowlMove : false;

  return base;
}

function getActiveSnakePlayerId(room) {
  if (!room.players || room.players.length === 0) return null;
  const activePlayers = room.players.filter(p => !p.hasFinished);
  if (activePlayers.length === 0) return null;
  const idx = (room.snakeState.turnIndex || 0) % activePlayers.length;
  return activePlayers[idx] ? activePlayers[idx].id : null;
}

function advanceSnakeTurn(room) {
  const activePlayers = room.players.filter(p => !p.hasFinished);
  if (activePlayers.length <= 1) {
    if (activePlayers.length === 1) {
      const loser = activePlayers[0];
      loser.isLastLoser = true;
      room.snakeState.lastLoser = {
        id: loser.id,
        name: loser.name,
        avatar: loser.avatar,
        color: loser.color
      };
      room.lastLoser = room.snakeState.lastLoser;
      room.commentary.unshift(`💀 ${loser.name} is THE LAST LOSER! Better luck next time!`);
    }
    room.gamePhase = 'match_over';
    distributeMatchPot(room);
    return;
  }
  room.snakeState.turnIndex = (room.snakeState.turnIndex + 1) % activePlayers.length;
}

// Forfeit Handler: If a player leaves/disconnects during an active match
function handlePlayerForfeit(room, leaverSocketId) {
  if (!room || (room.gamePhase !== 'playing' && room.gamePhase !== 'toss')) return false;

  const leaver = room.players.find(p => p.id === leaverSocketId);
  if (!leaver) return false;

  const remainingPlayers = room.players.filter(p => p.id !== leaverSocketId && !p.hasFinished);
  if (remainingPlayers.length === 0) return false;

  const winner = remainingPlayers[0];
  const stake = room.betAmount || 0;
  const transfers = [];

  if (stake > 0 && leaver.username && winner.username) {
    const res = userManager.transferCoins(leaver.username, winner.username, stake);
    if (res.success) {
      transfers.push({
        fromName: leaver.name,
        fromUsername: leaver.username,
        toName: winner.name,
        toUsername: winner.username,
        amount: res.amount
      });
      io.emit('user_coins_changed', { username: leaver.username, coins: res.fromNewCoins });
      io.emit('user_coins_changed', { username: winner.username, coins: res.toNewCoins });
    }
  }

  if (leaver.username) userManager.recordMatch(leaver.username, { gameType: room.gameType, won: false });
  if (winner.username) userManager.recordMatch(winner.username, { gameType: room.gameType, won: true });

  room.gamePhase = 'match_over';
  room.winner = {
    name: winner.name,
    username: winner.username,
    id: winner.id,
    reason: `${leaver.name} left the match (Forfeit)!`
  };
  room.lastLoser = {
    name: leaver.name,
    username: leaver.username,
    id: leaver.id,
    reason: 'Forfeit / Left Match'
  };

  const commentaryMsg = `⚠️ ${leaver.name} left the game! ${winner.name} WINS BY FORFEIT! ${stake > 0 ? `💰 ${stake} coins transferred to ${winner.name}!` : ''}`;
  room.commentary.unshift(commentaryMsg);

  io.to(room.code).emit('room_updated', { room: getPublicRoomState(room) });
  io.to(room.code).emit('coin_transfer_event', {
    transfers,
    reason: 'forfeit',
    leaverName: leaver.name,
    winnerName: winner.name,
    commentary: commentaryMsg
  });

  return true;
}

// Distribute Bet Stake directly from Losers to Winners
function resolvePlayerUsername(p) {
  if (!p) return null;
  if (p.username && userManager.getUser(p.username)) return p.username;
  if (p.name && userManager.getUser(p.name)) return p.name;
  const s = io.sockets.sockets.get(p.id);
  if (s && s.user && s.user.username) return s.user.username;
  return null;
}

function distributeMatchPot(room) {
  const stake = room.betAmount || 0;
  const transfers = [];

  if (room.gameType === 'cricket') {
    if (!room.winner || room.winner.key === 'tie') {
      room.commentary.unshift(`🤝 Match tied! No coins transferred.`);
    } else {
      const winTeamKey = room.winner.key;
      const loseTeamKey = winTeamKey === 'team1' ? 'team2' : 'team1';
      const winTeam = room[winTeamKey];
      const loseTeam = room[loseTeamKey];

      if (winTeam && loseTeam) {
        const winUsers = winTeam.players.map(p => ({ p, u: resolvePlayerUsername(p) })).filter(x => x.u);
        const loseUsers = loseTeam.players.map(p => ({ p, u: resolvePlayerUsername(p) })).filter(x => x.u);

        // Record career match outcome for both teams
        winUsers.forEach(({ u }) => {
          userManager.recordMatchOutcome(u, { gameType: 'cricket', won: true });
        });
        loseUsers.forEach(({ u }) => {
          userManager.recordMatchOutcome(u, { gameType: 'cricket', won: false });
        });

        if (stake > 0 && winUsers.length > 0 && loseUsers.length > 0) {
          // Har harne walay player ke account se betting coins deduct honge
          let totalLostPot = 0;
          loseUsers.forEach(({ p, u }) => {
            const userObj = userManager.getUser(u);
            const toDeduct = Math.min(userObj ? userObj.coins : 0, stake);
            if (toDeduct > 0) {
              userManager.adjustCoins(u, -toDeduct);
              totalLostPot += toDeduct;
              io.emit('user_coins_changed', { username: u, coins: userManager.getUser(u).coins });
            }
          });

          // Jeetne wali team ke players mein barabar share divide hoga
          const share = Math.floor(totalLostPot / winUsers.length);
          winUsers.forEach(({ p, u }) => {
            if (share > 0) {
              userManager.adjustCoins(u, share);
              io.emit('user_coins_changed', { username: u, coins: userManager.getUser(u).coins });
            }
            transfers.push({
              fromName: loseTeam.name,
              fromUsername: 'Losing Team',
              toName: p.name || u,
              toUsername: u,
              amount: share
            });
          });
        }
      }
    }
  } else if (room.gameType === 'snake') {
    const champ = room.snakeState.winners && room.snakeState.winners[0];
    if (champ) {
      const winnerPlayer = room.players.find(p => p.id === champ.id);
      const losers = room.players.filter(p => p.id !== champ.id);
      const champUser = resolvePlayerUsername(winnerPlayer);

      if (champUser) {
        userManager.recordMatchOutcome(champUser, { gameType: 'snake', won: true });
      }

      losers.forEach(lp => {
        const loseUser = resolvePlayerUsername(lp);
        if (loseUser) {
          userManager.recordMatchOutcome(loseUser, { gameType: 'snake', won: false });
          if (stake > 0 && champUser) {
            const res = userManager.transferCoins(loseUser, champUser, stake);
            if (res.success) {
              transfers.push({
                fromName: lp.name,
                fromUsername: loseUser,
                toName: winnerPlayer.name,
                toUsername: champUser,
                amount: res.amount
              });
              io.emit('user_coins_changed', { username: loseUser, coins: res.fromNewCoins });
              io.emit('user_coins_changed', { username: champUser, coins: res.toNewCoins });
            }
          }
        }
      });
    }
  } else if (room.gameType === 'ludo') {
    if (room.ludoState && room.ludoState.winner) {
      const winnerPlayer = room.players.find(p => p.id === room.ludoState.winner.id);
      const losers = room.players.filter(p => p.id !== room.ludoState.winner.id);
      const winUser = resolvePlayerUsername(winnerPlayer);

      if (winUser) {
        userManager.recordMatchOutcome(winUser, { gameType: 'ludo', won: true });
      }

      losers.forEach(lp => {
        const loseUser = resolvePlayerUsername(lp);
        if (loseUser) {
          userManager.recordMatchOutcome(loseUser, { gameType: 'ludo', won: false });
          if (stake > 0 && winUser) {
            const res = userManager.transferCoins(loseUser, winUser, stake);
            if (res.success) {
              transfers.push({
                fromName: lp.name,
                fromUsername: loseUser,
                toName: winnerPlayer.name,
                toUsername: winUser,
                amount: res.amount
              });
              io.emit('user_coins_changed', { username: loseUser, coins: res.fromNewCoins });
              io.emit('user_coins_changed', { username: winUser, coins: res.toNewCoins });
            }
          }
        }
      });
    }
  }

  if (transfers.length > 0) {
    io.to(room.code).emit('coin_transfer_event', {
      transfers,
      stake,
      commentary: `💰 ${transfers.map(t => `${t.amount} coins from ${t.fromName} ➔ ${t.toName}`).join(' | ')}`
    });
  }

  room.pot = 0;
}

// Online Active Players Helper (Strictly shows registered User ID)
function getOnlinePlayersList() {
  const online = [];
  const seenUsers = new Set();

  for (const [id, s] of io.sockets.sockets) {
    let uname = null;
    let role = 'guest';
    let coins = 0;
    let avatar = s.avatar || '🎮';

    if (s.user && s.user.username) {
      uname = s.user.username;
      role = s.user.role;
      const fresh = userManager.getUser(uname);
      if (fresh) {
        coins = fresh.coins;
        role = fresh.role;
      }
    } else if (s.playerName && s.playerName !== 'Player' && s.playerName !== 'Guest') {
      uname = s.playerName;
    }

    // Skip unauthenticated anonymous connections so "Guest" never appears in online list
    if (!uname) continue;

    const uKey = uname.toLowerCase();
    if (!seenUsers.has(uKey)) {
      seenUsers.add(uKey);
      let roomCode = null;
      let gameType = null;
      for (const r of rooms.values()) {
        if (r.players.some(p => p.id === id || (p.username && p.username.toLowerCase() === uKey))) {
          roomCode = r.code;
          gameType = r.gameType;
          break;
        }
      }

      online.push({
        id,
        username: uname,
        name: uname,
        avatar: avatar,
        role: role,
        coins: coins,
        roomCode,
        gameType,
        status: roomCode ? `In Room #${roomCode} (${gameType ? gameType.toUpperCase() : 'GAME'})` : 'In Main Lobby 🏠'
      });
    }
  }
  return online;
}

// Socket Connection
io.on('connection', (socket) => {
  let userRoomCode = null;
  let currentUser = null; // { username, role, coins }
  console.log(`⚡ [${new Date().toLocaleTimeString()}] Client connected: ${socket.id}`);

  // Broadcast live online count
  io.emit('online_count', { count: getOnlinePlayersList().length });

  // ========================================================
  // AUTHENTICATION & ADMIN NAQQASH ACTIONS
  // ========================================================
  socket.on('auth_restore', ({ username }) => {
    if (!username) return;
    const u = userManager.getUser(username);
    if (u) {
      currentUser = {
        username: u.username,
        role: u.role,
        coins: u.coins,
        stats: u.stats
      };
      socket.user = currentUser;
      socket.playerName = u.username;
      socket.emit('auth_success', { user: currentUser });
      console.log(`🔄 Session restored: ${currentUser.username}`);
      io.emit('online_count', { count: getOnlinePlayersList().length });
    }
  });

  socket.on('auth_login', ({ username, password }) => {
    const res = userManager.login(username, password);
    if (!res.success) {
      return socket.emit('auth_error', res.error);
    }
    currentUser = res.user;
    socket.user = currentUser;
    socket.playerName = currentUser.username;
    socket.emit('auth_success', { user: currentUser });
    console.log(`🔑 Login successful: ${currentUser.username} (${currentUser.role})`);
    io.emit('online_count', { count: getOnlinePlayersList().length });
  });

  // Admin Naqqash creates player ID & password
  socket.on('admin_create_user', ({ username, password, initialCoins }) => {
    if (!currentUser || currentUser.username !== 'naqqash') {
      return socket.emit('error_msg', 'Access Denied! Only Naqqash has Admin authority.');
    }
    const res = userManager.createUser('naqqash', { username, password, initialCoins });
    if (!res.success) {
      return socket.emit('error_msg', res.error);
    }
    socket.emit('admin_user_created', { user: res.user, allUsers: userManager.getAllUsers('naqqash') });
  });

  // Admin Naqqash removes / deletes player account
  socket.on('admin_delete_user', ({ targetUsername }) => {
    if (!currentUser || currentUser.username !== 'naqqash') {
      return socket.emit('error_msg', 'Access Denied! Only Naqqash has Admin authority.');
    }
    const res = userManager.deleteUser('naqqash', targetUsername);
    if (!res.success) {
      return socket.emit('error_msg', res.error);
    }
    socket.emit('admin_user_deleted', {
      deletedUsername: res.deletedUsername,
      allUsers: res.allUsers
    });
    // Disconnect active socket of deleted user
    for (const [id, s] of io.sockets.sockets) {
      if (s.user && s.user.username.toLowerCase() === targetUsername.toLowerCase()) {
        s.emit('error_msg', 'Your account has been deleted by Admin Naqqash.');
        s.user = null;
        s.disconnect();
      }
    }
    io.emit('online_count', { count: getOnlinePlayersList().length });
  });

  // Admin Naqqash allots coins to any user or himself (Add / Deduct / Set)
  socket.on('admin_allot_coins', ({ targetUsername, amount, action }) => {
    if (!currentUser || currentUser.username !== 'naqqash') {
      return socket.emit('error_msg', 'Access Denied! Only Naqqash has Admin authority.');
    }
    const res = userManager.allotCoins('naqqash', { targetUsername, amount, action });
    if (!res.success) {
      return socket.emit('error_msg', res.error);
    }
    socket.emit('admin_coins_updated', {
      targetUsername: res.username,
      newCoins: res.newCoins,
      allUsers: userManager.getAllUsers('naqqash')
    });
    io.emit('user_coins_changed', { username: res.username, coins: res.newCoins });
  });

  // Admin Naqqash lists all users
  socket.on('admin_get_users', () => {
    if (!currentUser || currentUser.username !== 'naqqash') {
      return socket.emit('error_msg', 'Access Denied! Only Naqqash has Admin authority.');
    }
    socket.emit('admin_users_list', { users: userManager.getAllUsers('naqqash') });
  });

  // Get current user stats
  socket.on('get_my_stats', () => {
    if (!currentUser) return;
    const u = userManager.getUser(currentUser.username);
    if (u) {
      socket.emit('my_stats', { stats: u.stats, coins: u.coins });
    }
  });

  // Get public global leaderboard (all players can see everyone's score/stats)
  socket.on('get_leaderboard', () => {
    socket.emit('leaderboard_data', { leaderboard: userManager.getPublicLeaderboard() });
  });

  // Get online players list
  socket.on('get_online_players', () => {
    socket.emit('online_players_list', { players: getOnlinePlayersList() });
  });

  // ========================================================
  // ROOM MANAGEMENT & BETTING
  // ========================================================
  socket.on('create_room', ({ playerName, gameType, team1Name, team2Name, maxOvers, avatar, betAmount }) => {
    const code = generateRoomCode();
    gameType = (gameType || 'snake').toLowerCase();
    const chosenAvatar = avatar || 'tiger';
    const playerColor = PLAYER_PALETTE[0];
    const username = (currentUser ? currentUser.username : playerName || 'Player 1').trim();
    const effectiveName = currentUser ? currentUser.username : (playerName || 'Player 1').trim();
    const stake = Math.max(0, parseInt(betAmount) || 0);

    // If betting, verify coins
    if (stake > 0 && currentUser) {
      const u = userManager.getUser(currentUser.username);
      if (!u || u.coins < stake) {
        return socket.emit('error_msg', `Not enough coins to bet ${stake}! Your balance: ${u ? u.coins : 0} coins.`);
      }
    }

    console.log(`🏠 Room CREATED: ${code} [${gameType.toUpperCase()}] Bet: ${stake} by ${effectiveName}`);

    const room = {
      code,
      gameType, // 'snake', 'cricket', 'ludo'
      hostId: socket.id,
      betAmount: stake,
      pot: stake > 0 ? stake : 0,
      createdAt: Date.now(),
      gamePhase: 'lobby',
      commentary: [`Room created! Welcome to ${gameType === 'snake' ? 'Snake & Ladders' : (gameType === 'ludo' ? 'Ludo Classic' : 'Hand Cricket')}!`],
      spectators: [],
      winner: null,
      lastLoser: null,
      players: [
        {
          id: socket.id,
          username,
          name: effectiveName,
          avatar: chosenAvatar,
          color: playerColor,
          position: 0,
          isLocked: true,
          hasFinished: false,
          finishRank: null,
          isLastLoser: false,
          totalRolls: 0,
          laddersClimbed: 0,
          snakesBitten: 0,
          hitGiant99: false
        }
      ],
      // Snake & Ladders state
      snakeState: {
        turnIndex: 0,
        lastRoll: null,
        lastEvent: null,
        winners: [],
        lastLoser: null,
        gameStartTime: null
      },
      // Ludo state
      ludoState: null,
      // Hand Cricket preserved state
      team1: {
        name: team1Name || 'Naqqash Tigers 🐯',
        players: [{ id: socket.id, username, name: playerName || 'Player 1', score: 0, balls: 0, isOut: false }],
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
      settings: {
        maxOvers: parseInt(maxOvers) || 2,
        ballsPerOver: 6
      },
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
      lastBallResult: null
    };

    rooms.set(code, room);
    userRoomCode = code;
    socket.join(code);

    socket.emit('room_created', {
      room: getPublicRoomState(room),
      myRole: 'player',
      myPlayerId: socket.id,
      color: playerColor
    });
  });

  socket.on('join_room', ({ code, playerName, role, avatar }) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      return socket.emit('error_msg', `Room "${code}" not found! Active rooms: [${Array.from(rooms.keys()).join(', ') || 'None'}]`);
    }

    if (room.players.length >= 30 && role !== 'spectator') {
      return socket.emit('error_msg', 'Room is full (Maximum 30 players). You can join as a spectator!');
    }

    const username = (currentUser ? currentUser.username : playerName || `Cousin ${room.players.length + 1}`).trim();
    const effectiveName = currentUser ? currentUser.username : (playerName || `Cousin ${room.players.length + 1}`).trim();
    const stake = room.betAmount || 0;

    // Check coins for bet if player
    if (role !== 'spectator' && stake > 0 && currentUser) {
      const u = userManager.getUser(currentUser.username);
      if (!u || u.coins < stake) {
        return socket.emit('error_msg', `Not enough coins to enter this room! Entry Bet: ${stake} coins. Your balance: ${u ? u.coins : 0}.`);
      }
    }

    userRoomCode = code;
    socket.join(code);

    const chosenAvatar = avatar || 'lion';
    const colorIdx = room.players.length % PLAYER_PALETTE.length;
    const playerColor = PLAYER_PALETTE[colorIdx];
    const userObj = {
      id: socket.id,
      username,
      name: effectiveName,
      avatar: chosenAvatar,
      color: playerColor,
      position: 0,
      isLocked: true,
      hasFinished: false,
      finishRank: null,
      isLastLoser: false,
      totalRolls: 0,
      laddersClimbed: 0,
      snakesBitten: 0,
      hitGiant99: false
    };

    if (role === 'spectator') {
      room.spectators.push({ id: socket.id, name: userObj.name, avatar: chosenAvatar });
    } else {
      room.players.push(userObj);
      if (room.gameType === 'cricket') {
        if (role === 'team2' || room.team1.players.length > room.team2.players.length) {
          room.team2.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
        } else {
          room.team1.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
        }
      }
    }

    room.commentary.unshift(`👋 ${userObj.name} joined the room!`);
    io.to(code).emit('room_updated', { room: getPublicRoomState(room) });
    socket.emit('joined_successfully', {
      room: getPublicRoomState(room),
      myRole: role || 'player',
      myPlayerId: socket.id,
      color: playerColor
    });
  });

  // Start Game
  socket.on('start_game', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.hostId !== socket.id) return;

    if (room.gameType === 'snake') {
      if (room.players.length < 1) return socket.emit('error_msg', 'Need at least 1 player to start!');
      room.gamePhase = 'playing';
      room.snakeState.turnIndex = 0;
      room.snakeState.gameStartTime = Date.now();
      room.commentary.unshift('🎲 Game started! All players are LOCKED! Roll a 1 to enter the board!');
      io.to(userRoomCode).emit('snake_game_started', { room: getPublicRoomState(room) });
    } else if (room.gameType === 'cricket') {
      room.gamePhase = 'toss';
      room.toss = {
        callingTeam: 'team2',
        callingTeamName: room.team2.name,
        coinState: 'flipping',
        winnerKey: null,
        decision: null
      };
      io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
    } else if (room.gameType === 'ludo') {
      room.gamePhase = 'playing';
      room.ludoState = ludoEngine.createInitialState(room.players);
      room.commentary.unshift('🎲 Classic Ludo started! Roll a 6 to bring tokens out!');
      io.to(userRoomCode).emit('ludo_game_started', { room: getPublicRoomState(room) });
    }
  });

  // ========================================================
  // SNAKE & LADDERS (STEP-BY-STEP PATH FOR SLOW SMOOTH HOPPING)
  // ========================================================
  socket.on('snake_roll_dice', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gameType !== 'snake' || room.gamePhase !== 'playing') return;

    const activeId = getActiveSnakePlayerId(room);
    if (activeId !== socket.id) {
      return socket.emit('error_msg', 'It is not your turn to roll!');
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.hasFinished) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    player.totalRolls = (player.totalRolls || 0) + 1;

    let eventType = 'normal';
    let prevPos = player.position;
    let newPos = prevPos;
    let bannerMsg = '';
    let stepPath = []; // Array of intermediate squares for client to animate step-by-step!

    if (player.isLocked) {
      if (roll === 1) {
        player.isLocked = false;
        player.position = 1;
        newPos = 1;
        stepPath = [1];
        eventType = 'unlocked';
        bannerMsg = `🎉 ${player.name} rolled a 1 and UNLOCKED! Token enters Square 1!`;
        room.commentary.unshift(bannerMsg);
      } else {
        eventType = 'stay_locked';
        bannerMsg = `🔒 ${player.name} rolled a ${roll}! Needs a 1 to unlock.`;
        room.commentary.unshift(bannerMsg);
      }
    } else {
      const targetPos = player.position + roll;

      if (targetPos > 100) {
        eventType = 'bounce';
        bannerMsg = `🎯 ${player.name} rolled a ${roll} but needs exact roll to reach 100! Stays at ${player.position}.`;
        room.commentary.unshift(bannerMsg);
      } else {
        // Build sequential square-by-square path
        for (let s = prevPos + 1; s <= targetPos; s++) {
          stepPath.push(s);
        }

        newPos = targetPos;
        player.position = newPos;

        // Check Ladder
        if (SNAKE_LADDERS[newPos]) {
          const ladderTop = SNAKE_LADDERS[newPos];
          player.laddersClimbed = (player.laddersClimbed || 0) + 1;
          eventType = 'ladder';
          bannerMsg = `🪜 YAY! ${player.name} climbed a ladder from ${newPos} up to ${ladderTop}!`;
          player.position = ladderTop;
          newPos = ladderTop;
          room.commentary.unshift(bannerMsg);
        }
        // Check Snake & Titan 99
        else if (SNAKE_SNAKES[newPos]) {
          const snakeTail = SNAKE_SNAKES[newPos];
          player.snakesBitten = (player.snakesBitten || 0) + 1;

          if (newPos === 99) {
            eventType = 'giant_99';
            player.hitGiant99 = true;
            bannerMsg = `🐍💀 OH NO! ${player.name} hit SQUARE 99! THE GIANT TITAN COBRA swallowed them down to ${snakeTail}!`;
          } else {
            eventType = 'snake';
            bannerMsg = `🐍 OUCH! ${player.name} got bitten by a snake at ${newPos} and slid down to ${snakeTail}!`;
          }
          player.position = snakeTail;
          newPos = snakeTail;
          room.commentary.unshift(bannerMsg);
        }

        // Check Win 100
        if (player.position === 100) {
          player.hasFinished = true;
          const rank = room.snakeState.winners.length + 1;
          player.finishRank = rank;

          const winObj = {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            color: player.color,
            rank: rank,
            totalRolls: player.totalRolls
          };
          room.snakeState.winners.push(winObj);

          if (rank === 1) {
            room.winner = winObj;
            eventType = 'win';
            bannerMsg = `🏆 CHAMPION! ${player.name} reached 100 and WON 1st PLACE!`;
          } else {
            bannerMsg = `🎖️ ${player.name} finished in ${rank === 2 ? '2nd' : (rank === 3 ? '3rd' : `${rank}th`)} Place!`;
          }
          room.commentary.unshift(bannerMsg);
        } else if (eventType === 'normal') {
          bannerMsg = `🎲 ${player.name} rolled a ${roll} and moved to ${newPos}.`;
          room.commentary.unshift(bannerMsg);
        }
      }
    }

    room.snakeState.lastRoll = {
      playerId: player.id,
      playerName: player.name,
      roll,
      prevPos,
      newPos: player.position,
      stepPath, // Slow smooth hopping array
      eventType,
      bannerMsg
    };
    room.snakeState.lastEvent = eventType;

    advanceSnakeTurn(room);

    io.to(userRoomCode).emit('snake_dice_rolled', {
      rollResult: room.snakeState.lastRoll,
      room: getPublicRoomState(room)
    });
  });

  // ========================================================
  // CLASSIC LUDO ENGINE EVENTS
  // ========================================================
  socket.on('ludo_roll_dice', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gameType !== 'ludo' || room.gamePhase !== 'playing' || !room.ludoState) return;

    const res = ludoEngine.rollDice(room.ludoState, socket.id);
    if (!res.success) return socket.emit('error_msg', res.error);

    io.to(userRoomCode).emit('ludo_dice_rolled', {
      roll: res.roll,
      eligibleTokens: res.eligibleTokens,
      room: getPublicRoomState(room)
    });

    // If no moves possible, pass turn after delay
    if (res.eligibleTokens.length === 0) {
      setTimeout(() => {
        if (room && room.ludoState) {
          ludoEngine.passTurn(room.ludoState);
          io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
        }
      }, 1000);
    }
  });

  socket.on('ludo_move_token', ({ tokenIndex }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gameType !== 'ludo' || room.gamePhase !== 'playing' || !room.ludoState) return;

    const res = ludoEngine.moveToken(room.ludoState, socket.id, parseInt(tokenIndex));
    if (!res.success) return socket.emit('error_msg', res.error);

    if (res.winner) {
      room.gamePhase = 'match_over';
      room.winner = res.winner;
      distributeMatchPot(room);
    }

    io.to(userRoomCode).emit('ludo_token_moved', {
      moveResult: res,
      room: getPublicRoomState(room)
    });
  });

  // ========================================================
  // HAND CRICKET ENGINE (BIG CLEAR POP-UPS & STATS)
  // ========================================================
  socket.on('switch_role', ({ newRole }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gamePhase !== 'lobby') return;

    let userName = 'Cousin';
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

    const userObj = { id: socket.id, name: userName, username: currentUser ? currentUser.username : userName };
    if (newRole === 'team1') room.team1.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
    else if (newRole === 'team2') room.team2.players.push({ ...userObj, score: 0, balls: 0, isOut: false });
    else {
      newRole = 'spectator';
      room.spectators.push(userObj);
    }

    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
    socket.emit('role_switched', { myRole: newRole });
  });

  socket.on('start_toss', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.team1.players.length === 0 || room.team2.players.length === 0) {
      return socket.emit('error_msg', 'Both teams need at least 1 player to play cricket!');
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
    if (!room || room.gamePhase !== 'toss' || !room.toss) return;
    if (room.toss.winnerKey) return; // Prevent duplicate calls

    const tossResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const isTeam1 = room.team1.players.some(p => p.id === socket.id);
    const callerTeamKey = isTeam1 ? 'team1' : 'team2';
    const otherTeamKey = callerTeamKey === 'team1' ? 'team2' : 'team1';

    const won = choice === tossResult;
    const winnerKey = won ? callerTeamKey : otherTeamKey;

    room.toss.coinResult = tossResult;
    room.toss.winnerKey = winnerKey;
    room.toss.winnerName = room[winnerKey].name;
    room.toss.coinState = 'done';
    room.commentary.unshift(`🪙 Coin result: ${tossResult.toUpperCase()}! ${room[winnerKey].name} won the toss!`);

    io.to(userRoomCode).emit('toss_completed', {
      tossResult,
      winnerKey,
      winnerName: room[winnerKey].name,
      room: getPublicRoomState(room)
    });
    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  socket.on('choose_toss_decision', ({ decision }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gamePhase !== 'toss' || !room.toss || !room.toss.winnerKey) return;

    const winnerKey = room.toss.winnerKey;
    // Ensure decision maker belongs to the winning team or is host
    const isAllowed = room[winnerKey].players.some(p => p.id === socket.id) || room.hostId === socket.id;
    if (!isAllowed) {
      return socket.emit('error_msg', 'Only the toss winning team can choose Bat or Bowl!');
    }

    const otherKey = winnerKey === 'team1' ? 'team2' : 'team1';
    room.toss.decision = decision;

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
    updateCricketActivePlayers(room);

    room.commentary.unshift(`🏏 ${room[winnerKey].name} ne toss jeet kar pehle ${decision === 'bat' ? 'BATTING' : 'BOWLING'} chuni! Match Shuru!`);
    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  function updateCricketActivePlayers(room) {
    const batTeam = room[room.battingTeamKey];
    const bowlTeam = room[room.bowlingTeamKey];
    let bIdx = batTeam.players.findIndex(p => !p.isOut);
    if (bIdx === -1) bIdx = 0;
    room.currentBatsmanIndex = bIdx;
    room.currentBatsman = batTeam.players[bIdx] || null;
    room.currentBowlerIndex = room.currentBowlerIndex % (bowlTeam.players.length || 1);
    room.currentBowler = bowlTeam.players[room.currentBowlerIndex] || null;
  }

  socket.on('play_move', ({ move }) => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room || room.gameType !== 'cricket' || room.gamePhase !== 'playing') return;

    const batsman = room.currentBatsman;
    const bowler = room.currentBowler;

    const isBatsman = batsman && batsman.id === socket.id;
    const isBowler = bowler && bowler.id === socket.id;

    if (!isBatsman && !isBowler) {
      return socket.emit('error_msg', 'Only the active Batsman and Bowler can pick moves!');
    }

    if (!room.pendingPicks) room.pendingPicks = { batMove: null, bowlMove: null };
    if (isBatsman) room.pendingPicks.batMove = move;
    if (isBowler) room.pendingPicks.bowlMove = move;

    io.to(userRoomCode).emit('pick_locked', {
      hasBatPicked: !!room.pendingPicks.batMove,
      hasBowlPicked: !!room.pendingPicks.bowlMove
    });

    if (room.pendingPicks.batMove !== null && room.pendingPicks.bowlMove !== null) {
      resolveCricketBall(room);
    }
  });

  function resolveCricketBall(room) {
    const batMove = room.pendingPicks.batMove;
    const bowlMove = room.pendingPicks.bowlMove;
    const batTeam = room[room.battingTeamKey];
    const bowlTeam = room[room.bowlingTeamKey];
    const batsman = room.currentBatsman;
    const bowler = room.currentBowler;

    room.pendingPicks = { batMove: null, bowlMove: null };

    const isOut = batMove === bowlMove;
    let runs = 0;
    let commentaryMsg = '';
    let popupTitle = '';
    let popupDetail = '';

    if (isOut) {
      batTeam.wickets++;
      if (batsman) batsman.isOut = true;
      popupTitle = '🔴 WICKET! OUT!';
      popupDetail = `Both picked ${batMove}! ${batsman ? batsman.name : 'Batsman'} is OUT!`;
      commentaryMsg = `🔴 OUT! Both picked ${batMove}! ${batsman ? batsman.name : 'Batsman'} is OUT!`;
      const bowlerU = resolvePlayerUsername(bowler);
      if (bowlerU) {
        userManager.addCricketInGameStats(bowlerU, { wickets: 1 });
      }
    } else {
      runs = batMove;
      batTeam.score += runs;
      if (batsman) {
        batsman.score = (batsman.score || 0) + runs;
        batsman.balls = (batsman.balls || 0) + 1;
        const batsmanU = resolvePlayerUsername(batsman);
        if (batsmanU) {
          userManager.addCricketInGameStats(batsmanU, { runs });
        }
      }

      if (runs === 6) {
        popupTitle = '🔥 HUGE SIX! (6)';
        popupDetail = `Thumbs Up! Batsman: 6 | Bowler: ${bowlMove}`;
        commentaryMsg = `🔥 HUGE SIX! Thumbs up! +6 runs!`;
      } else if (runs === 10) {
        popupTitle = '💥 MAXIMUM PUNCH! (10)';
        popupDetail = `Fist Blast! Batsman: 10 | Bowler: ${bowlMove}`;
        commentaryMsg = `💥 MAXIMUM PUNCH! 10 RUNS BLAST!`;
      } else {
        popupTitle = `⚡ ${runs} RUN${runs > 1 ? 'S' : ''}!`;
        popupDetail = `Batsman: ${batMove} | Bowler: ${bowlMove}`;
        commentaryMsg = `⚡ ${batsman ? batsman.name : 'Batsman'} scored ${runs} run${runs > 1 ? 's' : ''}!`;
      }
    }

    batTeam.balls++;
    const isOverComplete = batTeam.balls === 6;
    if (isOverComplete) {
      batTeam.overs++;
      batTeam.balls = 0;
      room.currentBowlerIndex++;
      updateCricketActivePlayers(room);
      room.commentary.unshift(`🏁 Over complete! (${batTeam.overs} Overs: ${batTeam.score}/${batTeam.wickets}). New bowler ${room.currentBowler ? room.currentBowler.name : ''} attacks!`);
    } else if (isOut) {
      updateCricketActivePlayers(room);
    }

    room.lastBallResult = {
      batMove,
      bowlMove,
      isOut,
      runs,
      isSix: runs === 6,
      isPunch: runs === 10,
      popupTitle,
      popupDetail,
      batsmanName: batsman ? batsman.name : '',
      bowlerName: bowler ? bowler.name : ''
    };
    room.commentary.unshift(commentaryMsg);

    const allOut = batTeam.wickets >= batTeam.players.length;
    const oversDone = batTeam.overs >= room.settings.maxOvers;

    if (room.currentInnings === 1) {
      if (allOut || oversDone) {
        room.target = batTeam.score + 1;
        room.currentInnings = 2;
        const temp = room.battingTeamKey;
        room.battingTeamKey = room.bowlingTeamKey;
        room.bowlingTeamKey = temp;
        room.currentBatsmanIndex = 0;
        room.currentBowlerIndex = 0;
        updateCricketActivePlayers(room);
        room.pendingPicks = { batMove: null, bowlMove: null };
        room.commentary.unshift(`🏁 1st Innings Over! Target: ${room.target} runs! ${room[room.battingTeamKey].name} is now BATTING!`);

        io.to(room.code).emit('innings_break', {
          target: room.target,
          newBattingTeam: room[room.battingTeamKey].name,
          newBowlingTeam: room[room.bowlingTeamKey].name,
          room: getPublicRoomState(room)
        });
      }
    } else {
      // Innings 2: Chase
      const chaseWon = batTeam.score >= room.target;
      if (chaseWon) {
        room.gamePhase = 'match_over';
        room.winner = { name: batTeam.name, key: room.battingTeamKey, margin: `${batTeam.players.length - batTeam.wickets} wickets` };
        room.commentary.unshift(`🏆 ${batTeam.name} WON THE MATCH by chasing the target!`);
        distributeMatchPot(room);
      } else if (allOut || oversDone) {
        room.gamePhase = 'match_over';
        if (batTeam.score === room.target - 1) {
          room.winner = { name: 'MATCH TIED!', key: 'tie', margin: 'Equal scores!' };
          room.commentary.unshift(`🤝 MATCH TIED! Both teams scored equal runs!`);
        } else {
          room.winner = { name: bowlTeam.name, key: room.bowlingTeamKey, margin: `${(room.target - 1) - batTeam.score} runs` };
          room.commentary.unshift(`🏆 ${bowlTeam.name} WON THE MATCH by defending the target!`);
        }
        distributeMatchPot(room);
      }
    }

    io.to(room.code).emit('ball_completed', {
      result: room.lastBallResult,
      room: getPublicRoomState(room)
    });

    if (room.gamePhase === 'match_over') {
      io.to(room.code).emit('room_updated', { room: getPublicRoomState(room) });
    }
  }

  // Live Chat Reaction
  socket.on('send_reaction', ({ emoji, senderName }) => {
    if (!userRoomCode) return;
    io.to(userRoomCode).emit('live_reaction', { emoji, senderName });
  });

  // Rematch / Restart
  socket.on('restart_match', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room) return;
    const isHost = room.hostId === socket.id;
    const isPlayer = room.players.some(p => p.id === socket.id);
    if (!isHost && !isPlayer) return;

    room.gamePhase = 'lobby';
    room.winner = null;
    room.lastLoser = null;

    if (room.gameType === 'snake') {
      room.players.forEach(p => {
        p.position = 0;
        p.isLocked = true;
        p.hasFinished = false;
        p.finishRank = null;
        p.isLastLoser = false;
        p.totalRolls = 0;
        p.laddersClimbed = 0;
        p.snakesBitten = 0;
        p.hitGiant99 = false;
      });
      room.snakeState = {
        turnIndex: 0,
        lastRoll: null,
        lastEvent: null,
        winners: [],
        lastLoser: null,
        gameStartTime: null
      };
      room.commentary.unshift('🔄 Room reset for a new Snake & Ladders race!');
    } else if (room.gameType === 'cricket') {
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
      room.toss = null;
      room.currentInnings = 1;
      room.currentBatsmanIndex = 0;
      room.currentBowlerIndex = 0;
      room.currentBatsman = null;
      room.currentBowler = null;
      room.lastBallResult = null;
      room.pendingPicks = { batMove: null, bowlMove: null };
      room.commentary = ['🔄 Cricket match reset! Get ready for a fresh match!'];
    } else if (room.gameType === 'ludo') {
      room.ludoState = ludoEngine.createInitialState(room.players);
      room.commentary = ['🔄 Classic Ludo reset for a new game!'];
    }

    io.to(userRoomCode).emit('match_restarted', { room: getPublicRoomState(room) });
    io.to(userRoomCode).emit('room_updated', { room: getPublicRoomState(room) });
  });

  // Leave room
  socket.on('leave_room', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room) return;
    const prevCode = userRoomCode;
    userRoomCode = null;
    socket.leave(prevCode);

    // If leaving during active match, forfeit game & transfer coins to opponent
    handlePlayerForfeit(room, socket.id);

    room.players = room.players.filter(p => p.id !== socket.id);
    room.team1.players = room.team1.players.filter(p => p.id !== socket.id);
    room.team2.players = room.team2.players.filter(p => p.id !== socket.id);
    room.spectators = room.spectators.filter(s => s.id !== socket.id);

    if (room.players.length === 0 && room.spectators.length === 0) {
      rooms.delete(prevCode);
    } else {
      if (room.hostId === socket.id) {
        const nextUser = room.players[0] || room.spectators[0];
        if (nextUser) room.hostId = nextUser.id;
      }
      io.to(prevCode).emit('room_updated', { room: getPublicRoomState(room) });
    }
  });

  socket.on('disconnect', () => {
    if (!userRoomCode) return;
    const room = rooms.get(userRoomCode);
    if (!room) return;

    // If disconnected during active match, forfeit game & transfer coins to opponent
    handlePlayerForfeit(room, socket.id);

    io.emit('online_count', { count: getOnlinePlayersList().length });

    setTimeout(() => {
      const activeSockets = io.sockets.adapter.rooms.get(userRoomCode);
      if (!activeSockets || activeSockets.size === 0) {
        rooms.delete(userRoomCode);
        console.log(`🧹 Room ${userRoomCode} cleaned up (all disconnected).`);
      }
    }, 60000);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`👑 NAQQASH Multi-Game Platform running on port ${PORT}`);
  console.log(`👉 Access locally: http://localhost:${PORT}`);
});
