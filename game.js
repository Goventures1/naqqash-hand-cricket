// NAQQASH - MULTIPLAYER FAMILY GAMING PLATFORM CLIENT CONTROLLER
// Supports Snake & Ladders (up to 30 players, Lock-on-1, Giant 99 Snake, Last Loser) & Hand Cricket

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_SERVER_URL = 'https://naqqash-hand-cricket.onrender.com';
  const SERVER_CONFIG_VERSION = 'v6_family_arena';

  // Available avatars
  const AVATARS = ['🐯', '🦁', '🐉', '🦅', '🐺', '👑', '⚔️', '🧙', '🤖', '🚀', '⚡', '💎'];

  // Persistent user state
  let myPlayerName = localStorage.getItem('naqqash_player_name') || '';
  let myAvatar = localStorage.getItem('naqqash_avatar') || '🐯';
  let myRole = 'player';
  let currentRoom = null;
  let selectedGameType = 'snake';
  let isSoundMuted = localStorage.getItem('naqqash_sound_muted') === 'true';

  // Server URL Setup
  let serverUrl = '';
  if (window.location.protocol.startsWith('http') && window.location.hostname && window.location.hostname !== 'localhost') {
    serverUrl = window.location.origin;
  } else {
    serverUrl = localStorage.getItem('naqqash_server_url') || DEFAULT_SERVER_URL;
  }

  // Socket initialization
  const socketOptions = {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 12000
  };
  let socket = (typeof io !== 'undefined') ? io(serverUrl, socketOptions) : null;

  // DOM Elements
  const headerHomeBtn = document.getElementById('headerHomeBtn');
  const backBtn = document.getElementById('backBtn');
  const roomBadge = document.getElementById('roomBadge');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const connStatusPill = document.getElementById('connStatusPill');
  const connStatusText = document.getElementById('connStatusText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const serverConfigBtn = document.getElementById('serverConfigBtn');

  // Views
  const homeScreen = document.getElementById('homeScreen');
  const roomLobbyView = document.getElementById('roomLobbyView');
  const snakeGameView = document.getElementById('snakeGameView');
  const cricketGameView = document.getElementById('cricketGameView');

  // Home Screen Elements
  const playerNameInput = document.getElementById('playerNameInput');
  const profileAvatarBtn = document.getElementById('profileAvatarBtn');
  const currentAvatarEmoji = document.getElementById('currentAvatarEmoji');
  const quickRoomCodeInput = document.getElementById('quickRoomCodeInput');
  const quickJoinBtn = document.getElementById('quickJoinBtn');
  const playSnakeBtn = document.getElementById('playSnakeBtn');
  const playCricketBtn = document.getElementById('playCricketBtn');
  const playLudoBtn = document.getElementById('playLudoBtn');

  // Modals
  const avatarModal = document.getElementById('avatarModal');
  const avatarPickerGrid = document.getElementById('avatarPickerGrid');
  const closeAvatarModalBtn = document.getElementById('closeAvatarModalBtn');
  const createRoomModal = document.getElementById('createRoomModal');
  const createModalTitle = document.getElementById('createModalTitle');
  const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
  const modalPlayerNameInput = document.getElementById('modalPlayerNameInput');
  const cricketCreateOptions = document.getElementById('cricketCreateOptions');
  const team1NameInput = document.getElementById('team1NameInput');
  const team2NameInput = document.getElementById('team2NameInput');
  const oversSelect = document.getElementById('oversSelect');
  const confirmCreateRoomBtn = document.getElementById('confirmCreateRoomBtn');
  const serverModal = document.getElementById('serverModal');
  const customServerUrlInput = document.getElementById('customServerUrlInput');
  const saveServerBtn = document.getElementById('saveServerBtn');
  const resetServerBtn = document.getElementById('resetServerBtn');
  const closeServerModalBtn = document.getElementById('closeServerModalBtn');
  const gameResultsModal = document.getElementById('gameResultsModal');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const returnHomeBtn = document.getElementById('returnHomeBtn');

  // Waiting Room Elements
  const lobbyGameBadge = document.getElementById('lobbyGameBadge');
  const lobbyRoomCode = document.getElementById('lobbyRoomCode');
  const copyInviteLinkBtn = document.getElementById('copyInviteLinkBtn');
  const connectedPlayersCount = document.getElementById('connectedPlayersCount');
  const lobbyPlayersGrid = document.getElementById('lobbyPlayersGrid');
  const lobbyWaitingNote = document.getElementById('lobbyWaitingNote');
  const startMatchBtn = document.getElementById('startMatchBtn');
  const cricketLobbyTeams = document.getElementById('cricketLobbyTeams');
  const lobbyTeam1List = document.getElementById('lobbyTeam1List');
  const lobbyTeam2List = document.getElementById('lobbyTeam2List');
  const joinTeam1Btn = document.getElementById('joinTeam1Btn');
  const joinTeam2Btn = document.getElementById('joinTeam2Btn');

  // Snake Arena Elements
  const snakeBoardMount = document.getElementById('snakeBoardMount');
  const snakeEventText = document.getElementById('snakeEventText');
  const snakeTurnAvatar = document.getElementById('snakeTurnAvatar');
  const snakeTurnName = document.getElementById('snakeTurnName');
  const snakeRollBtn = document.getElementById('snakeRollBtn');
  const snakeLeaderboardList = document.getElementById('snakeLeaderboardList');

  // Init Player info
  if (myPlayerName) playerNameInput.value = myPlayerName;
  currentAvatarEmoji.textContent = myAvatar;

  playerNameInput.addEventListener('input', (e) => {
    myPlayerName = e.target.value.trim();
    localStorage.setItem('naqqash_player_name', myPlayerName);
  });

  // Sound Engine Setup
  SoundEngine.setMuted(isSoundMuted);
  updateSoundUI();

  soundToggleBtn.addEventListener('click', () => {
    isSoundMuted = !isSoundMuted;
    SoundEngine.setMuted(isSoundMuted);
    updateSoundUI();
  });

  function updateSoundUI() {
    soundToggleBtn.textContent = isSoundMuted ? '🔇' : '🔊';
  }

  // View Navigation System
  function showView(viewId) {
    [homeScreen, roomLobbyView, snakeGameView, cricketGameView].forEach(v => {
      if (v) v.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    // Header updates
    if (viewId === 'homeScreen') {
      backBtn.style.display = 'none';
      roomBadge.style.display = 'none';
    } else {
      backBtn.style.display = 'inline-flex';
      if (currentRoom) {
        roomBadge.style.display = 'inline-flex';
        roomCodeDisplay.textContent = currentRoom.code;
      }
    }
  }

  // Header Back Button
  backBtn.addEventListener('click', () => {
    if (confirm('Leave this room and return to the home screen?')) {
      if (socket) socket.emit('leave_room');
      currentRoom = null;
      showView('homeScreen');
    }
  });

  headerHomeBtn.addEventListener('click', () => {
    if (!currentRoom || confirm('Return to home screen?')) {
      if (socket && currentRoom) socket.emit('leave_room');
      currentRoom = null;
      showView('homeScreen');
    }
  });

  // Avatar Picker
  profileAvatarBtn.addEventListener('click', () => {
    let html = '';
    AVATARS.forEach(av => {
      html += `<button class="avatar-selector-btn" style="width: 100%; height: 55px; font-size: 26px;" data-avatar="${av}">${av}</button>`;
    });
    avatarPickerGrid.innerHTML = html;
    avatarModal.style.display = 'flex';

    avatarPickerGrid.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        myAvatar = btn.getAttribute('data-avatar');
        currentAvatarEmoji.textContent = myAvatar;
        localStorage.setItem('naqqash_avatar', myAvatar);
        avatarModal.style.display = 'none';
      });
    });
  });

  closeAvatarModalBtn.addEventListener('click', () => {
    avatarModal.style.display = 'none';
  });

  // Server Modal
  serverConfigBtn.addEventListener('click', () => {
    customServerUrlInput.value = serverUrl;
    serverModal.style.display = 'flex';
  });
  closeServerModalBtn.addEventListener('click', () => {
    serverModal.style.display = 'none';
  });
  saveServerBtn.addEventListener('click', () => {
    const val = customServerUrlInput.value.trim().replace(/\/+$/, '');
    if (val) {
      localStorage.setItem('naqqash_server_url', val);
      window.location.reload();
    }
  });
  resetServerBtn.addEventListener('click', () => {
    localStorage.removeItem('naqqash_server_url');
    window.location.reload();
  });

  // Game Creation Modal Opening
  playSnakeBtn.addEventListener('click', () => openCreateModal('snake'));
  playCricketBtn.addEventListener('click', () => openCreateModal('cricket'));
  playLudoBtn.addEventListener('click', () => openCreateModal('ludo'));

  function openCreateModal(gameType) {
    selectedGameType = gameType;
    createModalTitle.textContent = gameType === 'snake' ? 'CREATE SNAKE & LADDERS ROOM' :
                                   gameType === 'ludo' ? 'CREATE LUDO ROOM' : 'CREATE HAND CRICKET ROOM';
    modalPlayerNameInput.value = myPlayerName || playerNameInput.value || '';
    cricketCreateOptions.style.display = gameType === 'cricket' ? 'block' : 'none';
    createRoomModal.style.display = 'flex';
  }

  closeCreateModalBtn.addEventListener('click', () => {
    createRoomModal.style.display = 'none';
  });

  confirmCreateRoomBtn.addEventListener('click', () => {
    const pName = modalPlayerNameInput.value.trim() || `Player ${Math.floor(Math.random() * 90 + 10)}`;
    myPlayerName = pName;
    localStorage.setItem('naqqash_player_name', myPlayerName);

    if (socket) {
      socket.emit('create_room', {
        playerName: pName,
        gameType: selectedGameType,
        avatar: myAvatar,
        team1Name: team1NameInput.value.trim(),
        team2Name: team2NameInput.value.trim(),
        maxOvers: oversSelect.value
      });
      createRoomModal.style.display = 'none';
    }
  });

  // Quick Join with Room Code
  quickJoinBtn.addEventListener('click', joinWithCode);
  quickRoomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinWithCode();
  });

  function joinWithCode() {
    const code = quickRoomCodeInput.value.trim().toUpperCase();
    if (!code || code.length < 3) {
      alert('Please enter a valid 5-letter Room Code!');
      return;
    }
    const pName = myPlayerName || playerNameInput.value.trim() || `Cousin ${Math.floor(Math.random() * 90 + 10)}`;
    myPlayerName = pName;
    localStorage.setItem('naqqash_player_name', myPlayerName);

    if (socket) {
      socket.emit('join_room', {
        code,
        playerName: pName,
        avatar: myAvatar,
        role: 'player'
      });
    }
  }

  // 1-Click Copy Invite Link
  copyInviteLinkBtn.addEventListener('click', () => {
    if (!currentRoom) return;
    const origin = window.location.origin;
    const inviteUrl = `${origin}/?room=${currentRoom.code}&game=${currentRoom.gameType}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      copyInviteLinkBtn.textContent = 'COPIED! ✅';
      setTimeout(() => copyInviteLinkBtn.textContent = 'COPY LINK 📋', 2000);
    }).catch(() => {
      prompt('Copy this invite link for your cousins:', inviteUrl);
    });
  });

  // Start Match (Host Only)
  startMatchBtn.addEventListener('click', () => {
    if (socket && currentRoom) {
      socket.emit('start_game');
    }
  });

  // Cricket Team Switching
  joinTeam1Btn.addEventListener('click', () => {
    if (socket) socket.emit('switch_role', { newRole: 'team1' });
  });
  joinTeam2Btn.addEventListener('click', () => {
    if (socket) socket.emit('switch_role', { newRole: 'team2' });
  });

  // ========================================================
  // SOCKET.IO EVENT HANDLERS
  // ========================================================
  function bindSocketEvents(s) {
    if (!s) return;

    s.on('connect', () => {
      connStatusPill.className = 'status-pill';
      connStatusText.textContent = 'ONLINE';
    });

    s.on('disconnect', () => {
      connStatusPill.className = 'status-pill offline';
      connStatusText.textContent = 'DISCONNECTED';
    });

    s.on('connect_error', () => {
      connStatusPill.className = 'status-pill offline';
      connStatusText.textContent = 'OFFLINE';
    });

    s.on('error_msg', (msg) => {
      alert(msg);
    });

    s.on('room_created', ({ room, myPlayerId }) => {
      handleRoomEntered(room, myPlayerId);
    });

    s.on('joined_successfully', ({ room, myPlayerId }) => {
      handleRoomEntered(room, myPlayerId);
    });

    s.on('room_updated', ({ room }) => {
      updateRoomState(room);
    });

    s.on('snake_game_started', ({ room }) => {
      currentRoom = room;
      initSnakeArena(room);
    });

    s.on('snake_dice_rolled', ({ rollResult, room }) => {
      currentRoom = room;
      handleSnakeRollResult(rollResult, room);
    });

    s.on('ball_completed', ({ result, room }) => {
      currentRoom = room;
      handleCricketBall(result, room);
    });

    s.on('toss_completed', ({ tossResult, winnerKey, winnerName, room }) => {
      currentRoom = room;
      handleCricketToss(tossResult, winnerKey, winnerName, room);
    });
  }

  bindSocketEvents(socket);

  // Room Joined / Created Entry point
  function handleRoomEntered(room, myPlayerId) {
    currentRoom = room;
    selectedGameType = room.gameType || 'snake';

    lobbyRoomCode.textContent = room.code;
    lobbyGameBadge.textContent = (room.gameType || 'snake').toUpperCase();

    // Check if cricket teams view needed
    cricketLobbyTeams.style.display = room.gameType === 'cricket' ? 'block' : 'none';

    updateRoomState(room);
    showView('roomLobbyView');
  }

  // Synchronize room state
  function updateRoomState(room) {
    currentRoom = room;
    if (!room) return;

    roomCodeDisplay.textContent = room.code;
    const isHost = socket && socket.id === room.hostId;

    // Connected Players in Lobby
    const players = room.snakeState ? room.snakeState.players :
                    room.gameType === 'cricket' ? [...room.team1.players, ...room.team2.players] : (room.players || []);

    connectedPlayersCount.textContent = players.length;

    let playersHtml = '';
    players.forEach(p => {
      const pHost = p.id === room.hostId;
      const color = (p.color && p.color.hex) ? p.color.hex : '#00f0ff';
      const av = p.avatar || '🐯';

      playersHtml += `
        <div class="player-tile" style="border-color: ${color};">
          ${pHost ? '<span class="host-crown-badge">👑</span>' : ''}
          <div class="player-tile-avatar" style="border-color: ${color}; background: rgba(0,0,0,0.4);">
            ${av}
          </div>
          <div class="player-tile-name">${p.name}</div>
          <div style="font-size: 0.68rem; color: ${color}; font-weight: 800;">${p.finishRank ? `Rank #${p.finishRank}` : (p.isLocked ? 'LOCKED 🔒' : 'READY')}</div>
        </div>
      `;
    });
    lobbyPlayersGrid.innerHTML = playersHtml;

    // Host Controls in Waiting Room
    if (isHost) {
      startMatchBtn.style.display = 'inline-flex';
      lobbyWaitingNote.style.display = 'none';
    } else {
      startMatchBtn.style.display = 'none';
      lobbyWaitingNote.style.display = 'block';
    }

    // Cricket Teams list
    if (room.gameType === 'cricket') {
      lobbyTeam1List.innerHTML = room.team1.players.map(p => `<div>${p.name}</div>`).join('') || '<div style="color: var(--text-muted);">No players yet</div>';
      lobbyTeam2List.innerHTML = room.team2.players.map(p => `<div>${p.name}</div>`).join('') || '<div style="color: var(--text-muted);">No players yet</div>';
    }

    // If currently playing in Snake arena
    if (room.gameType === 'snake' && room.gamePhase === 'playing') {
      updateSnakeArenaUI(room);
    } else if (room.gameType === 'cricket' && (room.gamePhase === 'playing' || room.gamePhase === 'toss')) {
      updateCricketArenaUI(room);
    }

    // Check Finished state
    if (room.gamePhase === 'match_over') {
      showResultsModal(room);
    }
  }

  // ========================================================
  // SNAKE & LADDERS ARENA CONTROLLER
  // ========================================================
  function initSnakeArena(room) {
    showView('snakeGameView');
    // Mount board SVG if not already mounted
    snakeBoardMount.innerHTML = SnakeGame.renderBoardSVG();
    updateSnakeArenaUI(room);
  }

  function updateSnakeArenaUI(room) {
    if (!room.snakeState) return;

    // 1. Update Board Tokens
    SnakeGame.updateTokens(room.snakeState.players, room.snakeState.activePlayerId);

    // 2. Active Turn Indicator
    const activeId = room.snakeState.activePlayerId;
    const isMyTurn = socket && socket.id === activeId;
    const activePlayer = room.snakeState.players.find(p => p.id === activeId);

    if (activePlayer) {
      snakeTurnAvatar.textContent = activePlayer.avatar || '🐯';
      snakeTurnName.textContent = activePlayer.name;
      if (activePlayer.color && activePlayer.color.hex) {
        snakeTurnAvatar.style.borderColor = activePlayer.color.hex;
      }
    }

    if (isMyTurn) {
      snakeRollBtn.disabled = false;
      snakeRollBtn.textContent = (activePlayer && activePlayer.isLocked) ? 'ROLL A 1 TO UNLOCK 🔒' : 'ROLL DICE 🎲';
    } else {
      snakeRollBtn.disabled = true;
      snakeRollBtn.textContent = activePlayer ? `WAITING FOR ${activePlayer.name.toUpperCase()}...` : 'WAITING...';
    }

    // 3. Update Live Race Leaderboard
    const sorted = [...room.snakeState.players].sort((a, b) => {
      if (a.hasFinished && !b.hasFinished) return -1;
      if (!a.hasFinished && b.hasFinished) return 1;
      if (a.hasFinished && b.hasFinished) return a.finishRank - b.finishRank;
      return b.position - a.position;
    });

    let lbHtml = '';
    sorted.forEach((p, idx) => {
      const color = (p.color && p.color.hex) ? p.color.hex : '#00f0ff';
      let statusClass = p.isLocked ? 'locked' : (p.hasFinished ? 'winner' : '');
      let statusText = p.hasFinished ? `🏆 Rank #${p.finishRank}` : (p.isLocked ? 'LOCKED 🔒' : `Sq. ${p.position}`);

      if (p.isLastLoser) {
        statusClass = 'loser';
        statusText = 'LAST LOSER 💀';
      }

      lbHtml += `
        <div class="lb-row">
          <div class="lb-rank">#${idx + 1}</div>
          <div class="lb-avatar" style="border-color: ${color};">${p.avatar || '🐯'}</div>
          <div class="lb-info">
            <div class="lb-name">${p.name}</div>
            <div class="lb-status ${statusClass}">${statusText}</div>
          </div>
        </div>
      `;
    });
    snakeLeaderboardList.innerHTML = lbHtml;
  }

  // Roll Dice Action
  snakeRollBtn.addEventListener('click', () => {
    if (socket) {
      snakeRollBtn.disabled = true;
      socket.emit('snake_roll_dice');
    }
  });

  function handleSnakeRollResult(rollResult, room) {
    // 3D Dice roll animation
    SnakeGame.rollDiceAnimation(rollResult.roll, () => {
      // Play specific event sounds
      if (rollResult.eventType === 'unlocked') {
        SoundEngine.playPlayerUnlock();
      } else if (rollResult.eventType === 'ladder') {
        SoundEngine.playLadderClimb();
      } else if (rollResult.eventType === 'snake') {
        SoundEngine.playSnakeSlide();
      } else if (rollResult.eventType === 'giant_99') {
        SoundEngine.playGiantSnake();
      } else if (rollResult.eventType === 'win') {
        SoundEngine.playWinnerFanfare();
      } else if (rollResult.eventType === 'normal') {
        SoundEngine.playTokenHop();
      }

      // Update banner text
      snakeEventText.textContent = rollResult.bannerMsg;

      // Update Board & UI
      updateSnakeArenaUI(room);
    });
  }

  // ========================================================
  // RESULTS MODAL & THE LAST LOSER 💀
  // ========================================================
  function showResultsModal(room) {
    const resultsPodium = document.getElementById('resultsPodium');
    const lastLoserCard = document.getElementById('lastLoserCard');
    const lastLoserName = document.getElementById('lastLoserName');

    if (room.gameType === 'snake') {
      const winners = room.snakeState.winners || [];
      let podiumHtml = '';

      if (winners[0]) {
        podiumHtml += `
          <div class="podium-slot rank-1">
            <div style="font-size: 28px;">👑</div>
            <div style="font-size: 1.1rem; font-weight: 900;">${winners[0].name}</div>
            <div style="font-size: 0.72rem; color: #f59e0b; font-weight: 800;">1st PLACE 🏆</div>
          </div>
        `;
      }
      if (winners[1]) {
        podiumHtml += `
          <div class="podium-slot rank-2">
            <div style="font-size: 24px;">🥈</div>
            <div style="font-size: 0.95rem; font-weight: 800;">${winners[1].name}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 800;">2nd PLACE</div>
          </div>
        `;
      }
      if (winners[2]) {
        podiumHtml += `
          <div class="podium-slot rank-3">
            <div style="font-size: 24px;">🥉</div>
            <div style="font-size: 0.95rem; font-weight: 800;">${winners[2].name}</div>
            <div style="font-size: 0.72rem; color: #b45309; font-weight: 800;">3rd PLACE</div>
          </div>
        `;
      }
      resultsPodium.innerHTML = podiumHtml;

      // THE LAST LOSER 💀
      if (room.snakeState.lastLoser) {
        lastLoserName.textContent = room.snakeState.lastLoser.name;
        lastLoserCard.style.display = 'flex';
        SoundEngine.playLastLoser();
      } else {
        lastLoserCard.style.display = 'none';
      }
    } else {
      // Cricket results
      resultsPodium.innerHTML = `
        <div class="podium-slot rank-1" style="width: 100%;">
          <div style="font-size: 28px;">🏆</div>
          <div style="font-size: 1.2rem; font-weight: 900;">${room.winner ? room.winner.name : 'MATCH OVER'}</div>
          <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 800;">${room.winner ? (room.winner.margin || 'Victory!') : ''}</div>
        </div>
      `;
      lastLoserCard.style.display = 'none';
      SoundEngine.playWinnerFanfare();
    }

    gameResultsModal.style.display = 'flex';
  }

  // Play Again / Rematch
  playAgainBtn.addEventListener('click', () => {
    gameResultsModal.style.display = 'none';
    if (socket && currentRoom) {
      socket.emit('restart_match');
    }
  });

  returnHomeBtn.addEventListener('click', () => {
    gameResultsModal.style.display = 'none';
    if (socket && currentRoom) socket.emit('leave_room');
    currentRoom = null;
    showView('homeScreen');
  });

  // ========================================================
  // CRICKET ARENA CONTROLLER (PRESERVED)
  // ========================================================
  const cricketT1Name = document.getElementById('cricketT1Name');
  const cricketT1Score = document.getElementById('cricketT1Score');
  const cricketT1Wickets = document.getElementById('cricketT1Wickets');
  const cricketT1Overs = document.getElementById('cricketT1Overs');
  const cricketT2Name = document.getElementById('cricketT2Name');
  const cricketT2Score = document.getElementById('cricketT2Score');
  const cricketT2Wickets = document.getElementById('cricketT2Wickets');
  const cricketTarget = document.getElementById('cricketTarget');
  const cricketMaxOvers = document.getElementById('cricketMaxOvers');
  const cricketBatsmanName = document.getElementById('cricketBatsmanName');
  const cricketBowlerName = document.getElementById('cricketBowlerName');
  const cricketCommentaryText = document.getElementById('cricketCommentaryText');
  const cricketTossSection = document.getElementById('cricketTossSection');
  const cricketHandsStage = document.getElementById('cricketHandsStage');
  const cricketPickSection = document.getElementById('cricketPickSection');
  const callHeadsBtn = document.getElementById('callHeadsBtn');
  const callTailsBtn = document.getElementById('callTailsBtn');
  const chooseBatBtn = document.getElementById('chooseBatBtn');
  const chooseBowlBtn = document.getElementById('chooseBowlBtn');
  const cricketTossDecisionButtons = document.getElementById('cricketTossDecisionButtons');
  const cricketTossButtons = document.getElementById('cricketTossButtons');
  const batsmanHandMount = document.getElementById('batsmanHandMount');
  const bowlerHandMount = document.getElementById('bowlerHandMount');

  function updateCricketArenaUI(room) {
    showView('cricketGameView');
    cricketT1Name.textContent = room.team1.name;
    cricketT1Score.textContent = room.team1.score;
    cricketT1Wickets.textContent = room.team1.wickets;
    cricketT1Overs.textContent = `${room.team1.overs}.${room.team1.balls}`;

    cricketT2Name.textContent = room.team2.name;
    cricketT2Score.textContent = room.team2.score;
    cricketT2Wickets.textContent = room.team2.wickets;
    cricketTarget.textContent = room.target || '---';
    cricketMaxOvers.textContent = room.settings ? room.settings.maxOvers : 2;

    if (room.currentBatsman) cricketBatsmanName.textContent = room.currentBatsman.name;
    if (room.currentBowler) cricketBowlerName.textContent = room.currentBowler.name;
    if (room.commentary && room.commentary[0]) cricketCommentaryText.textContent = room.commentary[0];

    // Toss Phase
    if (room.gamePhase === 'toss') {
      cricketTossSection.style.display = 'block';
      cricketHandsStage.style.display = 'none';
      cricketPickSection.style.display = 'none';
    } else {
      cricketTossSection.style.display = 'none';
      cricketHandsStage.style.display = 'flex';
      cricketPickSection.style.display = 'block';
    }
  }

  // Cricket Pick Run Gesture
  document.querySelectorAll('.run-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'));
      if (socket) {
        socket.emit('play_move', { move: val });
        SoundEngine.playBatShot();
      }
    });
  });

  callHeadsBtn.addEventListener('click', () => { if (socket) socket.emit('call_toss', { choice: 'heads' }); });
  callTailsBtn.addEventListener('click', () => { if (socket) socket.emit('call_toss', { choice: 'tails' }); });
  chooseBatBtn.addEventListener('click', () => { if (socket) socket.emit('choose_toss_decision', { decision: 'bat' }); });
  chooseBowlBtn.addEventListener('click', () => { if (socket) socket.emit('choose_toss_decision', { decision: 'bowl' }); });

  function handleCricketBall(result, room) {
    if (typeof HandRenderer !== 'undefined') {
      batsmanHandMount.innerHTML = HandRenderer.getHandSVG(result.batMove, 'batsman', true);
      bowlerHandMount.innerHTML = HandRenderer.getHandSVG(result.bowlMove, 'bowler', true);
    }
    if (result.isOut) {
      SoundEngine.playOutWhistle();
    } else {
      SoundEngine.playBatShot();
    }
    updateCricketArenaUI(room);
  }

  function handleCricketToss(tossResult, winnerKey, winnerName, room) {
    cricketTossButtons.style.display = 'none';
    cricketTossDecisionButtons.style.display = 'flex';
  }

  // Check URL parameters for direct room joining (e.g. ?room=ABCDE&game=snake)
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    quickRoomCodeInput.value = roomParam.toUpperCase();
    setTimeout(() => {
      joinWithCode();
    }, 500);
  }
});
