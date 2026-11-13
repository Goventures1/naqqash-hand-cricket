// NAQQASH HAND CRICKET - CLIENT GAME ENGINE
// Supports real-time multiplayer, live spectating, animated 2 hands, 6 thumbs-up, 10 punch, audio FX & Offline Pass & Play

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_SERVER_URL = 'https://televisions-giving-acquisition-wave.trycloudflare.com';
  const SERVER_CONFIG_VERSION = 'v3_20261112';

  // Auto-clear stale/expired tunnel URLs from old app builds
  const savedVer = localStorage.getItem('naqqash_server_ver');
  const savedUrl = localStorage.getItem('naqqash_server_url');
  if (
    savedVer !== SERVER_CONFIG_VERSION ||
    (savedUrl && (
      savedUrl.includes('serveousercontent.com') ||
      savedUrl.includes('loca.lt') ||
      savedUrl.includes('lhr.life') ||
      savedUrl.includes('caring-por-tiles-editor')
    ))
  ) {
    localStorage.removeItem('naqqash_server_url');
    localStorage.setItem('naqqash_server_ver', SERVER_CONFIG_VERSION);
  }

  // 1. If in browser: ALWAYS use current origin (so whoever opens the web link is on the exact same server!)
  let serverUrl = '';
  if (window.location.protocol.startsWith('http') && window.location.hostname && window.location.hostname !== 'localhost') {
    serverUrl = window.location.origin;
  } else {
    // 2. If in native APK: use saved URL or active Cloudflare tunnel
    serverUrl = localStorage.getItem('naqqash_server_url') || DEFAULT_SERVER_URL;
  }

  const socketOptions = {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 12000
  };

  // DOM Elements (resolved before socket initialization)
  const connStatusPill = document.getElementById('connStatusPill');
  const connStatusText = document.getElementById('connStatusText');
  const lobbyConnBanner = document.getElementById('lobbyConnBanner');
  const lobbyConnText = document.getElementById('lobbyConnText');
  const quickFixServerBtn = document.getElementById('quickFixServerBtn');

  function setConnUI(state) {
    if (state === 'online') {
      if (connStatusPill) {
        connStatusPill.style.borderColor = '#10b981';
        connStatusPill.style.color = '#34d399';
      }
      if (connStatusText) connStatusText.textContent = 'ONLINE';
      if (lobbyConnBanner) lobbyConnBanner.style.color = '#34d399';
      if (lobbyConnText) lobbyConnText.textContent = 'Connected to Match Server 🟢';
      if (quickFixServerBtn) quickFixServerBtn.style.display = 'none';
    } else if (state === 'connecting') {
      if (connStatusPill) {
        connStatusPill.style.borderColor = '#f59e0b';
        connStatusPill.style.color = '#fbbf24';
      }
      if (connStatusText) connStatusText.textContent = 'CONNECTING';
      if (lobbyConnBanner) lobbyConnBanner.style.color = '#fbbf24';
      if (lobbyConnText) lobbyConnText.textContent = 'Connecting to Server... 🟡';
      if (quickFixServerBtn) quickFixServerBtn.style.display = 'inline-block';
    } else {
      if (connStatusPill) {
        connStatusPill.style.borderColor = '#ef4444';
        connStatusPill.style.color = '#fca5a5';
      }
      if (connStatusText) connStatusText.textContent = 'OFFLINE';
      if (lobbyConnBanner) lobbyConnBanner.style.color = '#fca5a5';
      if (lobbyConnText) lobbyConnText.textContent = 'Server Not Reachable 🔴 Check Link/Internet';
      if (quickFixServerBtn) quickFixServerBtn.style.display = 'inline-block';
    }
  }

  let socket = (typeof io !== 'undefined') ? io(serverUrl, socketOptions) : null;

  function bindSocketEvents(s) {
    if (!s) {
      setConnUI('offline');
      return;
    }
    s.on('connect', () => setConnUI('online'));
    s.on('disconnect', () => setConnUI('connecting'));
    s.on('connect_error', () => setConnUI('offline'));
  }

  setConnUI('connecting');
  bindSocketEvents(socket);

  // State
  let currentRoom = null;
  let myRole = 'team1'; // 'team1', 'team2', 'spectator'
  let myPlayerName = '';
  let selectedMove = null;
  let deferredPrompt = null;
  let isSoundMuted = false;
  let isOfflineMode = false;
  let offlineState = null;
  let revealTimer = null;
  let countdownInterval = null;

  // DOM Elements
  const lobbyView = document.getElementById('lobbyView');
  const waitingRoomView = document.getElementById('waitingRoomView');
  const gameView = document.getElementById('gameView');

  // Header Elements
  const backBtn = document.getElementById('backBtn');
  const leaveWaitingRoomBtn = document.getElementById('leaveWaitingRoomBtn');
  const roomBadge = document.getElementById('roomBadge');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const serverConfigBtn = document.getElementById('serverConfigBtn');
  const installBanner = document.getElementById('installBanner');
  const installAppBtn = document.getElementById('installAppBtn');

  // Online & Live Viewers Elements
  const arenaT1Label = document.getElementById('arenaT1Label');
  const arenaT1List = document.getElementById('arenaT1List');
  const arenaT2Label = document.getElementById('arenaT2Label');
  const arenaT2List = document.getElementById('arenaT2List');
  const arenaSpectatorsList = document.getElementById('arenaSpectatorsList');
  const totalOnlineCountBadge = document.getElementById('totalOnlineCountBadge');

  // Server Modal
  const serverModal = document.getElementById('serverModal');
  const customServerUrlInput = document.getElementById('customServerUrlInput');
  const saveServerBtn = document.getElementById('saveServerBtn');
  const closeServerModalBtn = document.getElementById('closeServerModalBtn');

  // Lobby Tabs & Inputs
  const tabCreate = document.getElementById('tabCreate');
  const tabJoin = document.getElementById('tabJoin');
  const tabOffline = document.getElementById('tabOffline');
  const createSection = document.getElementById('createSection');
  const joinSection = document.getElementById('joinSection');
  const offlineSection = document.getElementById('offlineSection');
  const playerNameInput = document.getElementById('playerNameInput');
  const team1NameInput = document.getElementById('team1NameInput');
  const team2NameInput = document.getElementById('team2NameInput');
  const oversSelect = document.getElementById('oversSelect');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const joinRoomBtn = document.getElementById('joinRoomBtn');

  // Offline Inputs
  const offT1Name = document.getElementById('offT1Name');
  const offT2Name = document.getElementById('offT2Name');
  const offOvers = document.getElementById('offOvers');
  const startOfflineBtn = document.getElementById('startOfflineBtn');

  // Role buttons
  const roleOpts = document.querySelectorAll('.role-opt[data-role]');

  // Waiting Room Elements
  const waitingRoomCode = document.getElementById('waitingRoomCode');
  const lobbyT1Name = document.getElementById('lobbyT1Name');
  const lobbyT2Name = document.getElementById('lobbyT2Name');
  const lobbyT1Players = document.getElementById('lobbyT1Players');
  const lobbyT2Players = document.getElementById('lobbyT2Players');
  const lobbySpectators = document.getElementById('lobbySpectators');
  const joinT1Btn = document.getElementById('joinT1Btn');
  const joinT2Btn = document.getElementById('joinT2Btn');
  const joinSpecBtn = document.getElementById('joinSpecBtn');
  const startTossBtn = document.getElementById('startTossBtn');

  // Game Arena Elements
  const inningsBadge = document.getElementById('inningsBadge');
  const targetBadge = document.getElementById('targetBadge');
  const oversBadge = document.getElementById('oversBadge');
  const sbTeam1Box = document.getElementById('sbTeam1Box');
  const sbTeam2Box = document.getElementById('sbTeam2Box');
  const sbT1Tag = document.getElementById('sbT1Tag');
  const sbT2Tag = document.getElementById('sbT2Tag');
  const sbT1Name = document.getElementById('sbT1Name');
  const sbT2Name = document.getElementById('sbT2Name');
  const sbT1Score = document.getElementById('sbT1Score');
  const sbT1Wickets = document.getElementById('sbT1Wickets');
  const sbT2Score = document.getElementById('sbT2Score');
  const sbT2Wickets = document.getElementById('sbT2Wickets');
  const sbT1Overs = document.getElementById('sbT1Overs');
  const sbT2Overs = document.getElementById('sbT2Overs');
  const curBatsmanName = document.getElementById('curBatsmanName');
  const curBatsmanScore = document.getElementById('curBatsmanScore');
  const curBowlerName = document.getElementById('curBowlerName');
  const pitchStatus = document.getElementById('pitchStatus');
  const batsmanHandLabel = document.getElementById('batsmanHandLabel');
  const bowlerHandLabel = document.getElementById('bowlerHandLabel');
  const batsmanHandSlot = document.getElementById('batsmanHandSlot');
  const bowlerHandSlot = document.getElementById('bowlerHandSlot');
  const batsmanStatusPill = document.getElementById('batsmanStatusPill');
  const bowlerStatusPill = document.getElementById('bowlerStatusPill');
  const ballResultOverlay = document.getElementById('ballResultOverlay');
  const resultBadge = document.getElementById('resultBadge');
  const resultDetailText = document.getElementById('resultDetailText');
  const nextBallTimer = document.getElementById('nextBallTimer');
  const controlsSection = document.getElementById('controlsSection');
  const turnInstruction = document.getElementById('turnInstruction');
  const gestureBtns = document.querySelectorAll('.gesture-btn');
  const spectatorNotice = document.getElementById('spectatorNotice');
  const liveSpectatorCount = document.getElementById('liveSpectatorCount');
  const commentaryFeed = document.getElementById('commentaryFeed');
  const reactionBtns = document.querySelectorAll('.reaction-btn');

  // Toss Modal
  const tossModal = document.getElementById('tossModal');
  const tossSubtitle = document.getElementById('tossSubtitle');
  const coinInner = document.getElementById('coinInner');
  const tossChoiceButtons = document.getElementById('tossChoiceButtons');
  const callHeadsBtn = document.getElementById('callHeadsBtn');
  const callTailsBtn = document.getElementById('callTailsBtn');
  const tossDecisionSection = document.getElementById('tossDecisionSection');
  const tossWinnerText = document.getElementById('tossWinnerText');
  const chooseBatBtn = document.getElementById('chooseBatBtn');
  const chooseBowlBtn = document.getElementById('chooseBowlBtn');

  // Match Over Modal
  const matchOverModal = document.getElementById('matchOverModal');
  const matchSummaryText = document.getElementById('matchSummaryText');
  const rematchBtn = document.getElementById('rematchBtn');

  // Server Settings Modal
  function openServerModal() {
    customServerUrlInput.value = serverUrl;
    serverModal.style.display = 'flex';
  }
  serverConfigBtn.addEventListener('click', openServerModal);
  if (quickFixServerBtn) quickFixServerBtn.addEventListener('click', openServerModal);

  const presetOnlineBtn = document.getElementById('presetOnlineBtn');
  const presetWifiBtn = document.getElementById('presetWifiBtn');
  if (presetOnlineBtn) {
    presetOnlineBtn.addEventListener('click', () => {
      customServerUrlInput.value = DEFAULT_SERVER_URL;
    });
  }
  if (presetWifiBtn) {
    presetWifiBtn.addEventListener('click', () => {
      customServerUrlInput.value = 'http://192.168.10.12:3000';
    });
  }

  closeServerModalBtn.addEventListener('click', () => {
    serverModal.style.display = 'none';
  });

  saveServerBtn.addEventListener('click', () => {
    let newUrl = customServerUrlInput.value.trim().replace(/\/+$/, '');
    if (newUrl && !/^https?:\/\//i.test(newUrl)) {
      newUrl = 'https://' + newUrl;
    }
    if (newUrl) {
      localStorage.setItem('naqqash_server_url', newUrl);
      localStorage.setItem('naqqash_server_ver', SERVER_CONFIG_VERSION);
      serverUrl = newUrl;
      if (socket) socket.disconnect();
      setConnUI('connecting');
      socket = (typeof io !== 'undefined') ? io(serverUrl, socketOptions) : null;
      bindSocketEvents(socket);
      attachAllSocketHandlers();
      serverModal.style.display = 'none';
    }
  });

  // Back to Lobby / Leave Match
  function handleBackToLobby() {
    if (!confirm('Kya aap match chhor kar Lobby par wapis jana chahtay hain?')) {
      return;
    }
    if (isOfflineMode) {
      isOfflineMode = false;
      offlineState = null;
    } else if (socket) {
      socket.emit('leave_room');
      currentRoom = null;
    }
    gameView.style.display = 'none';
    waitingRoomView.style.display = 'none';
    tossModal.style.display = 'none';
    matchOverModal.style.display = 'none';
    lobbyView.style.display = 'block';
    roomBadge.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
  }

  if (backBtn) backBtn.addEventListener('click', handleBackToLobby);
  if (leaveWaitingRoomBtn) leaveWaitingRoomBtn.addEventListener('click', handleBackToLobby);

  // PWA Install Event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.style.display = 'flex';
  });

  installAppBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBanner.style.display = 'none';
      }
      deferredPrompt = null;
    }
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    isSoundMuted = !isSoundMuted;
    SoundEngine.muted = isSoundMuted;
    soundToggleBtn.textContent = isSoundMuted ? '🔇' : '🔊';
  });

  // Tabs
  tabCreate.addEventListener('click', () => {
    tabCreate.classList.add('active');
    tabJoin.classList.remove('active');
    tabOffline.classList.remove('active');
    createSection.style.display = 'block';
    joinSection.style.display = 'none';
    offlineSection.style.display = 'none';
  });

  tabJoin.addEventListener('click', () => {
    tabJoin.classList.add('active');
    tabCreate.classList.remove('active');
    tabOffline.classList.remove('active');
    createSection.style.display = 'none';
    joinSection.style.display = 'block';
    offlineSection.style.display = 'none';
  });

  tabOffline.addEventListener('click', () => {
    tabOffline.classList.add('active');
    tabCreate.classList.remove('active');
    tabJoin.classList.remove('active');
    createSection.style.display = 'none';
    joinSection.style.display = 'none';
    offlineSection.style.display = 'block';
  });

  // Role Opts
  let selectedJoinRole = 'team1';
  roleOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      roleOpts.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedJoinRole = btn.dataset.role;
    });
  });

  function runWhenConnected(btn, defaultHtml, actionFn) {
    if (socket && socket.connected) {
      actionFn();
      return;
    }
    if (!socket) {
      alert('Server library load nahi hui! App dobara kholein.');
      return;
    }
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ CONNECTING TO SERVER...</span>`;
    socket.connect();

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      socket.off('connect', onConn);
      btn.disabled = false;
      btn.innerHTML = defaultHtml;
    };
    const onConn = () => {
      cleanup();
      actionFn();
    };
    socket.on('connect', onConn);

    setTimeout(() => {
      if (!done) {
        cleanup();
        alert('Server se connect nahi ho saka! Internet check karein ya ⚙️ Server Settings mein naya link dalein.');
      }
    }, 8000);
  }

  // Create Room
  createRoomBtn.addEventListener('click', () => {
    isOfflineMode = false;
    const name = playerNameInput.value.trim() || 'Naqqash';
    myPlayerName = name;
    SoundEngine.init();

    runWhenConnected(createRoomBtn, `<span>CREATE MATCH ROOM</span> 🚀`, () => {
      socket.emit('create_room', {
        playerName: name,
        team1Name: team1NameInput.value.trim(),
        team2Name: team2NameInput.value.trim(),
        maxOvers: oversSelect.value
      });
    });
  });

  // Join Room
  joinRoomBtn.addEventListener('click', () => {
    isOfflineMode = false;
    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) {
      alert('Please enter a 5-digit room code!');
      return;
    }
    const name = playerNameInput.value.trim() || 'Cousin';
    myPlayerName = name;
    SoundEngine.init();

    runWhenConnected(joinRoomBtn, `<span>ENTER ROOM</span> 🎯`, () => {
      socket.emit('join_room', {
        code,
        playerName: name,
        role: selectedJoinRole
      });
    });
  });

  // Role switches in waiting room
  joinT1Btn.addEventListener('click', () => socket.emit('switch_role', { newRole: 'team1' }));
  joinT2Btn.addEventListener('click', () => socket.emit('switch_role', { newRole: 'team2' }));
  joinSpecBtn.addEventListener('click', () => socket.emit('switch_role', { newRole: 'spectator' }));

  // Start Toss (Host)
  startTossBtn.addEventListener('click', () => {
    SoundEngine.init();
    socket.emit('start_toss');
  });

  // Toss Choice (Heads / Tails)
  callHeadsBtn.addEventListener('click', () => callToss('heads'));
  callTailsBtn.addEventListener('click', () => callToss('tails'));

  function callToss(choice) {
    tossChoiceButtons.style.display = 'none';
    coinInner.classList.add('flipping');
    SoundEngine.playReveal();

    setTimeout(() => {
      if (isOfflineMode) {
        handleOfflineToss(choice);
      } else {
        socket.emit('call_toss', { choice });
      }
    }, 1500);
  }

  // Toss Decision (Bat / Bowl)
  chooseBatBtn.addEventListener('click', () => {
    tossModal.style.display = 'none';
    if (isOfflineMode) {
      handleOfflineTossDecision('bat');
    } else {
      socket.emit('choose_toss_decision', { decision: 'bat' });
    }
  });

  chooseBowlBtn.addEventListener('click', () => {
    tossModal.style.display = 'none';
    if (isOfflineMode) {
      handleOfflineTossDecision('bowl');
    } else {
      socket.emit('choose_toss_decision', { decision: 'bowl' });
    }
  });

  // Gesture Controls (1, 2, 3, 4, 5, 6 👍, 10 👊)
  gestureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.value);
      selectedMove = val;

      gestureBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      SoundEngine.playTick();

      if (isOfflineMode) {
        handleOfflineMove(val);
      } else {
        // Submit move to server
        socket.emit('play_move', { move: val });
        gestureBtns.forEach(b => b.disabled = true);
        turnInstruction.textContent = `🔒 Move ${val === 6 ? '👍 SIX' : (val === 10 ? '👊 PUNCH' : val)} Locked! Waiting for opponent...`;
      }
    });
  });

  // Live Reactions
  reactionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      if (!isOfflineMode) {
        socket.emit('send_reaction', { emoji, senderName: myPlayerName });
      }
      spawnFloatingEmoji(emoji);
    });
  });

  function spawnFloatingEmoji(emoji) {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.right = (20 + Math.random() * 40) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  // Rematch
  rematchBtn.addEventListener('click', () => {
    matchOverModal.style.display = 'none';
    if (isOfflineMode) {
      startOfflineMatch();
    } else {
      socket.emit('restart_match');
    }
  });

  // ================= OFFLINE PASS & PLAY ENGINE =================
  startOfflineBtn.addEventListener('click', () => {
    isOfflineMode = true;
    SoundEngine.init();
    startOfflineMatch();
  });

  function startOfflineMatch() {
    offlineState = {
      team1: { name: offT1Name.value.trim() || 'Naqqash Tigers 🐯', score: 0, wickets: 0, balls: 0, overs: 0, players: [{ name: 'Player 1', score: 0, balls: 0 }] },
      team2: { name: offT2Name.value.trim() || 'Cousin Kings 🏏', score: 0, wickets: 0, balls: 0, overs: 0, players: [{ name: 'Player 2', score: 0, balls: 0 }] },
      settings: { maxOvers: parseInt(offOvers.value) || 2 },
      currentInnings: 1,
      battingTeamKey: 'team1',
      bowlingTeamKey: 'team2',
      target: null,
      turnPhase: 'bat_pick', // 'bat_pick', 'pass_to_bowl', 'bowl_pick'
      batMove: null,
      bowlMove: null,
      commentary: ['📱 Offline Pass & Play match started!']
    };

    // Show Toss Modal
    lobbyView.style.display = 'none';
    tossModal.style.display = 'flex';
    tossSubtitle.textContent = `${offlineState.team2.name} calls Heads or Tails!`;
    tossChoiceButtons.style.display = 'flex';
    tossDecisionSection.style.display = 'none';
  }

  function handleOfflineToss(choice) {
    const tossResult = Math.random() < 0.5 ? 'heads' : 'tails';
    coinInner.classList.remove('flipping');
    coinInner.style.transform = tossResult === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)';

    const winnerKey = choice === tossResult ? 'team2' : 'team1';
    offlineState.tossWinnerKey = winnerKey;
    const winnerName = offlineState[winnerKey].name;

    tossChoiceButtons.style.display = 'none';
    tossDecisionSection.style.display = 'block';
    tossWinnerText.textContent = `🎉 ${winnerName} won the toss! Choose to Bat or Bowl:`;
  }

  function handleOfflineTossDecision(decision) {
    const winnerKey = offlineState.tossWinnerKey;
    const otherKey = winnerKey === 'team1' ? 'team2' : 'team1';
    if (decision === 'bat') {
      offlineState.battingTeamKey = winnerKey;
      offlineState.bowlingTeamKey = otherKey;
    } else {
      offlineState.battingTeamKey = otherKey;
      offlineState.bowlingTeamKey = winnerKey;
    }

    tossModal.style.display = 'none';
    setupOfflineArena();
  }

  function setupOfflineArena() {
    lobbyView.style.display = 'none';
    waitingRoomView.style.display = 'none';
    gameView.style.display = 'block';
    roomBadge.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'flex';
    roomCodeDisplay.textContent = 'OFFLINE';

    renderOfflineScoreboard();

    // Start with Batsman pick
    offlineState.turnPhase = 'bat_pick';
    offlineState.batMove = null;
    offlineState.bowlMove = null;

    const batTeamName = offlineState[offlineState.battingTeamKey].name;
    const bowlTeamName = offlineState[offlineState.bowlingTeamKey].name;

    if (batsmanHandLabel) batsmanHandLabel.textContent = `🏏 ${batTeamName} (Bat)`;
    if (bowlerHandLabel) bowlerHandLabel.textContent = `⚾ ${bowlTeamName} (Bowl)`;

    batsmanHandSlot.innerHTML = HandRenderer.getHandSVG(null, 'batsman', false);
    bowlerHandSlot.innerHTML = HandRenderer.getHandSVG(null, 'bowler', false);
    batsmanStatusPill.textContent = 'Pick secret fingers!';
    batsmanStatusPill.className = 'hand-status-pill';
    bowlerStatusPill.textContent = 'Waiting for pass...';
    bowlerStatusPill.className = 'hand-status-pill';

    ballResultOverlay.style.display = 'none';

    controlsSection.style.display = 'block';
    spectatorNotice.style.display = 'none';
    gestureBtns.forEach(b => {
      b.disabled = false;
      b.classList.remove('selected');
    });

    turnInstruction.innerHTML = `🏏 <b>[${batTeamName}] Batsman's Turn:</b> Pick your secret fingers (don't show bowler!):`;
  }

  function renderOfflineScoreboard() {
    inningsBadge.textContent = `INNINGS ${offlineState.currentInnings}`;
    if (offlineState.target) {
      targetBadge.style.display = 'inline-block';
      targetBadge.textContent = `TARGET: ${offlineState.target}`;
    } else {
      targetBadge.style.display = 'none';
    }

    const batTeam = offlineState[offlineState.battingTeamKey];
    const bowlTeam = offlineState[offlineState.bowlingTeamKey];

    oversBadge.textContent = `OVERS: ${batTeam.overs.toFixed(1)} / ${offlineState.settings.maxOvers}`;

    sbT1Name.textContent = offlineState.team1.name;
    sbT2Name.textContent = offlineState.team2.name;
    sbT1Score.textContent = offlineState.team1.score;
    sbT1Wickets.textContent = offlineState.team1.wickets;
    sbT1Overs.textContent = offlineState.team1.overs.toFixed(1);

    sbT2Score.textContent = offlineState.team2.score;
    sbT2Wickets.textContent = offlineState.team2.wickets;
    sbT2Overs.textContent = offlineState.team2.overs.toFixed(1);

    const isT1Bat = offlineState.battingTeamKey === 'team1';
    sbTeam1Box.className = `team-box ${isT1Bat ? 'batting' : 'bowling'}`;
    sbTeam2Box.className = `team-box ${isT1Bat ? 'bowling' : 'batting'}`;
    sbT1Tag.textContent = isT1Bat ? 'BATTING' : 'BOWLING';
    sbT2Tag.textContent = isT1Bat ? 'BOWLING' : 'BATTING';

    curBatsmanName.textContent = batTeam.name;
    curBatsmanScore.textContent = `(${batTeam.score} runs)`;
    curBowlerName.textContent = bowlTeam.name;

    if (offlineState.commentary) {
      commentaryFeed.innerHTML = offlineState.commentary.map(line => `<div class="comm-line">${line}</div>`).join('');
    }
  }

  function handleOfflineMove(val) {
    if (offlineState.turnPhase === 'bat_pick') {
      offlineState.batMove = val;
      offlineState.turnPhase = 'pass_to_bowl';

      // Hide fingers and prompt pass
      gestureBtns.forEach(b => b.disabled = true);
      batsmanStatusPill.textContent = '🔒 Picked!';
      const bowlTeamName = offlineState[offlineState.bowlingTeamKey].name;

      turnInstruction.innerHTML = `
        <div style="font-size: 1rem; color: #f59e0b; margin-bottom: 6px;">🤝 Hand the phone to <b>${bowlTeamName}</b> (Bowler)!</div>
        <button id="passConfirmBtn" class="btn-primary" style="padding: 8px 16px; margin: 0 auto; width: auto; font-size: 0.85rem;">I AM READY (TAP TO BOWL)</button>
      `;

      document.getElementById('passConfirmBtn').addEventListener('click', () => {
        offlineState.turnPhase = 'bowl_pick';
        gestureBtns.forEach(b => {
          b.disabled = false;
          b.classList.remove('selected');
        });
        turnInstruction.innerHTML = `⚾ <b>[${bowlTeamName}] Bowler's Turn:</b> Pick fingers to get the batsman OUT:`;
      });

    } else if (offlineState.turnPhase === 'bowl_pick') {
      offlineState.bowlMove = val;
      gestureBtns.forEach(b => b.disabled = true);
      bowlerStatusPill.textContent = '🔒 Picked!';

      // Reveal ball!
      handleOfflineBallReveal();
    }
  }

  function handleOfflineBallReveal() {
    if (revealTimer) clearTimeout(revealTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    const batMove = offlineState.batMove;
    const bowlMove = offlineState.bowlMove;
    const batTeam = offlineState[offlineState.battingTeamKey];
    const bowlTeam = offlineState[offlineState.bowlingTeamKey];

    // Animation
    const batHand = batsmanHandSlot.querySelector('.hand-svg');
    const bowlHand = bowlerHandSlot.querySelector('.hand-svg');
    if (batHand) batHand.classList.add('hand-countdown');
    if (bowlHand) bowlHand.classList.add('hand-countdown');

    pitchStatus.textContent = '1... 2... 3... REVEAL!';
    SoundEngine.playReveal();

    setTimeout(() => {
      batsmanHandSlot.innerHTML = HandRenderer.getHandSVG(batMove, 'batsman', true);
      bowlerHandSlot.innerHTML = HandRenderer.getHandSVG(bowlMove, 'bowler', true);

      batsmanStatusPill.textContent = HandRenderer.getMoveLabel(batMove);
      batsmanStatusPill.className = 'hand-status-pill revealed';
      bowlerStatusPill.textContent = HandRenderer.getMoveLabel(bowlMove);
      bowlerStatusPill.className = 'hand-status-pill revealed';

      batTeam.balls++;
      const ballsInOver = batTeam.balls % 6;
      batTeam.overs = Math.floor(batTeam.balls / 6) + (ballsInOver / 10);

      let isOut = false;
      let runs = 0;

      if (batMove === bowlMove) {
        isOut = true;
        batTeam.wickets++;
        resultBadge.className = 'result-badge out';
        resultBadge.textContent = 'OUT! 🔴';
        resultDetailText.textContent = `☝️ OUT! Both showed ${batMove}! Wicket falls!`;
        SoundEngine.playOut();
        offlineState.commentary.unshift(`☝️ OUT! Both showed ${batMove}! Wicket falls!`);
      } else {
        runs = batMove;
        batTeam.score += runs;
        if (batMove === 6) {
          resultBadge.className = 'result-badge six';
          resultBadge.textContent = 'SIX! 👍';
          resultDetailText.textContent = `💥 SIXER! ${batTeam.name}: 6 vs ${bowlTeam.name}: ${bowlMove}`;
          SoundEngine.playSixBoom();
        } else if (batMove === 10) {
          resultBadge.className = 'result-badge ten';
          resultBadge.textContent = 'PUNCH 10! 👊';
          resultDetailText.textContent = `💣 SUPER PUNCH! ${batTeam.name}: 10 vs ${bowlTeam.name}: ${bowlMove}`;
          SoundEngine.playPunch10();
        } else {
          resultBadge.className = 'result-badge runs';
          resultBadge.textContent = `+${runs} RUNS`;
          resultDetailText.textContent = `🏏 ${batTeam.name}: ${batMove} fingers vs ${bowlTeam.name}: ${bowlMove} fingers`;
          SoundEngine.playBatShot();
        }
        offlineState.commentary.unshift(`🏏 Bat showed ${batMove}, Bowl showed ${bowlMove}. +${runs} Runs!`);
      }

      ballResultOverlay.style.display = 'block';
      renderOfflineScoreboard();

      // Generous 4-second countdown so players can clearly inspect the open fingers
      let secondsLeft = 4;
      nextBallTimer.textContent = `Agli ball ${secondsLeft}s mein...`;
      countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
          nextBallTimer.textContent = `Agli ball ${secondsLeft}s mein...`;
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Check Match End / Innings End
      revealTimer = setTimeout(() => {
        ballResultOverlay.style.display = 'none';

        // 2nd innings target check
        if (offlineState.currentInnings === 2 && offlineState.target && batTeam.score >= offlineState.target) {
          showMatchOver(`${batTeam.name} chased the target and WON the match! 🏆`);
          return;
        }

        // Overs or Wickets check
        const maxBalls = offlineState.settings.maxOvers * 6;
        if (isOut || batTeam.balls >= maxBalls) {
          if (offlineState.currentInnings === 1) {
            offlineState.target = batTeam.score + 1;
            offlineState.currentInnings = 2;
            const temp = offlineState.battingTeamKey;
            offlineState.battingTeamKey = offlineState.bowlingTeamKey;
            offlineState.bowlingTeamKey = temp;
            offlineState.commentary.unshift(`🔔 Innings 1 Over! Target is ${offlineState.target} runs.`);
            SoundEngine.playFanfare();
            alert(`Innings 1 Over! Target is ${offlineState.target} runs for ${offlineState[offlineState.battingTeamKey].name}!`);
            setupOfflineArena();
            return;
          } else {
            // 2nd innings over
            if (batTeam.score >= offlineState.target) {
              showMatchOver(`${batTeam.name} WON the match! 🏆`);
            } else if (batTeam.score === offlineState.target - 1) {
              showMatchOver('MATCH TIED! 🤝 What a thrilling finish!');
            } else {
              showMatchOver(`${bowlTeam.name} WON by ${offlineState.target - 1 - batTeam.score} runs! 🏆`);
            }
            return;
          }
        }

        // Next ball
        setupOfflineArena();
      }, 4200);

    }, 800);
  }

  function showMatchOver(summary) {
    SoundEngine.playFanfare();
    matchSummaryText.textContent = summary;
    matchOverModal.style.display = 'flex';
  }

  // ================= SOCKET EVENT LISTENERS (ONLINE MODE) =================
  function attachAllSocketHandlers() {
    if (!socket) return;
    socket.off('room_created');
    socket.off('joined_successfully');
    socket.off('role_switched');
    socket.off('room_updated');
    socket.off('toss_completed');
    socket.off('pick_locked');
    socket.off('ball_completed');
    socket.off('innings_ended');
    socket.off('match_finished');
    socket.off('live_reaction');
    socket.off('error_msg');

    socket.on('room_created', ({ room, myRole: role }) => {
      currentRoom = room;
      myRole = role;
      setupWaitingRoom(room);
    });

    socket.on('joined_successfully', ({ room, myRole: role }) => {
      currentRoom = room;
      myRole = role;
      if (room.gamePhase === 'playing') {
        setupGameArena(room);
      } else {
        setupWaitingRoom(room);
      }
    });

    socket.on('role_switched', ({ myRole: role }) => {
      myRole = role;
    });

    socket.on('room_updated', ({ room }) => {
      currentRoom = room;
      if (room.gamePhase === 'lobby') {
        setupWaitingRoom(room);
      } else if (room.gamePhase === 'toss') {
        showTossView(room);
      } else if (room.gamePhase === 'playing') {
        setupGameArena(room);
      }
    });

    socket.on('toss_completed', ({ tossResult, winnerKey, winnerName, room }) => {
      currentRoom = room;
      coinInner.classList.remove('flipping');
      coinInner.style.transform = tossResult === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)';
      
      tossChoiceButtons.style.display = 'none';
      tossDecisionSection.style.display = 'block';
      tossWinnerText.textContent = `🎉 ${winnerName} won the toss!`;

      const isWinnerHost = (winnerKey === 'team1' && room.hostId === socket.id) || 
                           (winnerKey === 'team2' && room.team2.players.some(p => p.id === socket.id));
      if (!isWinnerHost && myRole !== winnerKey) {
        chooseBatBtn.disabled = true;
        chooseBowlBtn.disabled = true;
        tossWinnerText.textContent += ' Waiting for captain to choose bat or bowl...';
      } else {
        chooseBatBtn.disabled = false;
        chooseBowlBtn.disabled = false;
      }
    });

    socket.on('pick_locked', ({ hasBatPicked, hasBowlPicked }) => {
      if (hasBatPicked) {
        batsmanStatusPill.textContent = '🔒 Ready!';
        batsmanStatusPill.classList.add('ready');
      }
      if (hasBowlPicked) {
        bowlerStatusPill.textContent = '🔒 Ready!';
        bowlerStatusPill.classList.add('ready');
      }
    });

    socket.on('ball_completed', ({ room, result }) => {
      currentRoom = room;
      handleBallReveal(result, room);
    });

    socket.on('innings_ended', ({ room, target }) => {
      currentRoom = room;
      pitchStatus.textContent = `INNINGS BREAK! Target: ${target} runs`;
      SoundEngine.playFanfare();
      setTimeout(() => {
        setupGameArena(room);
      }, 4000);
    });

    socket.on('match_finished', ({ room, summary }) => {
      currentRoom = room;
      setupGameArena(room);
      SoundEngine.playFanfare();

      setTimeout(() => {
        matchSummaryText.textContent = summary;
        matchOverModal.style.display = 'flex';
      }, 2000);
    });

    socket.on('live_reaction', ({ emoji, senderName }) => {
      spawnFloatingEmoji(emoji);
    });

    socket.on('error_msg', (msg) => {
      alert(msg);
    });
  }

  attachAllSocketHandlers();

  // ================= VIEW CONTROLLERS =================

  function setupWaitingRoom(room) {
    lobbyView.style.display = 'none';
    gameView.style.display = 'none';
    waitingRoomView.style.display = 'block';
    roomBadge.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'flex';
    roomCodeDisplay.textContent = room.code;
    waitingRoomCode.textContent = room.code;

    lobbyT1Name.textContent = room.team1.name;
    lobbyT2Name.textContent = room.team2.name;

    lobbyT1Players.innerHTML = room.team1.players.map(p => `<li>🟢 🏏 <b>${p.name}</b> ${p.id === socket.id ? '(You)' : ''}</li>`).join('') || '<li style="color:#64748b;">No players yet</li>';
    lobbyT2Players.innerHTML = room.team2.players.map(p => `<li>🟢 🏏 <b>${p.name}</b> ${p.id === socket.id ? '(You)' : ''}</li>`).join('') || '<li style="color:#64748b;">No players yet</li>';
    lobbySpectators.innerHTML = room.spectators.map(s => `👀 <b>${s.name}</b> ${s.id === socket.id ? '(You)' : ''}`).join(', ') || 'No spectators yet';

    if (room.hostId === socket.id) {
      startTossBtn.style.display = 'flex';
    } else {
      startTossBtn.style.display = 'none';
    }
  }

  function showTossView(room) {
    waitingRoomView.style.display = 'none';
    tossModal.style.display = 'flex';
    tossSubtitle.textContent = `${room.team2.name} calls Heads or Tails!`;
    tossChoiceButtons.style.display = 'flex';
    tossDecisionSection.style.display = 'none';

    const isCaller = room.team2.players.some(p => p.id === socket.id);
    if (!isCaller && room.hostId !== socket.id) {
      callHeadsBtn.disabled = true;
      callTailsBtn.disabled = true;
      tossSubtitle.textContent = `Waiting for ${room.team2.name} to call Heads or Tails...`;
    } else {
      callHeadsBtn.disabled = false;
      callTailsBtn.disabled = false;
    }
  }

  function setupGameArena(room) {
    tossModal.style.display = 'none';
    waitingRoomView.style.display = 'none';
    lobbyView.style.display = 'none';
    gameView.style.display = 'block';
    roomBadge.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'flex';
    roomCodeDisplay.textContent = room.code;

    // Update Online Squad & Live Viewers Lists
    if (arenaT1Label) arenaT1Label.textContent = room.team1.name;
    if (arenaT2Label) arenaT2Label.textContent = room.team2.name;

    if (arenaT1List) {
      arenaT1List.innerHTML = room.team1.players.map(p => {
        const isBat = room.battingTeamKey === 'team1' && room.currentBatsman && room.currentBatsman.id === p.id;
        const isBowl = room.bowlingTeamKey === 'team1' && room.currentBowler && room.currentBowler.id === p.id;
        const status = isBat ? '🏏 Batting' : (isBowl ? '⚾ Bowling' : (p.isOut ? '🔴 Out' : '🟢 Ready'));
        return `<li>🟢 <b>${p.name}</b> ${p.id === socket.id ? '(You)' : ''} <span style="color:#94a3b8; font-size:0.65rem;">[${status}]</span></li>`;
      }).join('') || '<li style="color:#64748b;">No players</li>';
    }

    if (arenaT2List) {
      arenaT2List.innerHTML = room.team2.players.map(p => {
        const isBat = room.battingTeamKey === 'team2' && room.currentBatsman && room.currentBatsman.id === p.id;
        const isBowl = room.bowlingTeamKey === 'team2' && room.currentBowler && room.currentBowler.id === p.id;
        const status = isBat ? '🏏 Batting' : (isBowl ? '⚾ Bowling' : (p.isOut ? '🔴 Out' : '🟢 Ready'));
        return `<li>🟢 <b>${p.name}</b> ${p.id === socket.id ? '(You)' : ''} <span style="color:#94a3b8; font-size:0.65rem;">[${status}]</span></li>`;
      }).join('') || '<li style="color:#64748b;">No players</li>';
    }

    if (arenaSpectatorsList) {
      if (room.spectators && room.spectators.length > 0) {
        arenaSpectatorsList.innerHTML = room.spectators.map(s => `<span style="display:inline-block; margin-right:8px; padding:2px 6px; background:rgba(255,255,255,0.06); border-radius:6px;">👀 <b>${s.name}</b> ${s.id === socket.id ? '(You)' : ''}</span>`).join(' ');
      } else {
        arenaSpectatorsList.textContent = 'Abhi koi tashaayi match live nahi dekh raha (Only players)';
      }
    }

    if (totalOnlineCountBadge) {
      const total = room.team1.players.length + room.team2.players.length + room.spectators.length;
      totalOnlineCountBadge.textContent = `${total} Online (${room.spectators.length} Live Watching)`;
    }

    inningsBadge.textContent = `INNINGS ${room.currentInnings}`;
    if (room.target) {
      targetBadge.style.display = 'inline-block';
      targetBadge.textContent = `TARGET: ${room.target}`;
    } else {
      targetBadge.style.display = 'none';
    }

    oversBadge.textContent = `OVERS: ${room[room.battingTeamKey].overs.toFixed(1)} / ${room.settings.maxOvers}`;

    sbT1Name.textContent = room.team1.name;
    sbT2Name.textContent = room.team2.name;
    sbT1Score.textContent = room.team1.score;
    sbT1Wickets.textContent = room.team1.wickets;
    sbT1Overs.textContent = room.team1.overs.toFixed(1);

    sbT2Score.textContent = room.team2.score;
    sbT2Wickets.textContent = room.team2.wickets;
    sbT2Overs.textContent = room.team2.overs.toFixed(1);

    const isT1Batting = room.battingTeamKey === 'team1';
    sbTeam1Box.className = `team-box ${isT1Batting ? 'batting' : 'bowling'}`;
    sbTeam2Box.className = `team-box ${isT1Batting ? 'bowling' : 'batting'}`;
    sbT1Tag.textContent = isT1Batting ? 'BATTING' : 'BOWLING';
    sbT2Tag.textContent = isT1Batting ? 'BOWLING' : 'BATTING';

    const batPlayer = room.currentBatsman;
    const bowlPlayer = room.currentBowler;
    const batPlayerName = batPlayer ? batPlayer.name : 'Batsman';
    const bowlPlayerName = bowlPlayer ? bowlPlayer.name : 'Bowler';

    curBatsmanName.textContent = batPlayerName;
    curBatsmanScore.textContent = batPlayer ? `(${batPlayer.score}r, ${batPlayer.balls}b)` : '';
    curBowlerName.textContent = bowlPlayerName;

    if (batsmanHandLabel) batsmanHandLabel.textContent = `🏏 ${batPlayerName}`;
    if (bowlerHandLabel) bowlerHandLabel.textContent = `${bowlPlayerName} ⚾`;

    liveSpectatorCount.textContent = room.spectators.length;

    batsmanHandSlot.innerHTML = HandRenderer.getHandSVG(null, 'batsman', false);
    bowlerHandSlot.innerHTML = HandRenderer.getHandSVG(null, 'bowler', false);

    batsmanStatusPill.textContent = 'Thinking...';
    batsmanStatusPill.className = 'hand-status-pill';
    bowlerStatusPill.textContent = 'Thinking...';
    bowlerStatusPill.className = 'hand-status-pill';

    pitchStatus.textContent = 'READY FOR NEXT BALL';
    ballResultOverlay.style.display = 'none';

    if (room.commentary && room.commentary.length > 0) {
      commentaryFeed.innerHTML = room.commentary.map(line => `<div class="comm-line">${line}</div>`).join('');
    }

    const isBatsman = batPlayer && batPlayer.id === socket.id;
    const isBowler = bowlPlayer && bowlPlayer.id === socket.id;

    if (isBatsman || isBowler) {
      controlsSection.style.display = 'block';
      spectatorNotice.style.display = 'none';
      gestureBtns.forEach(b => {
        b.disabled = false;
        b.classList.remove('selected');
      });

      if (isBatsman) {
        turnInstruction.innerHTML = `🏏 <b>Your Turn to BAT!</b> Open fingers (6 = 👍 Thumbs Up, 10 = 👊 Punch):`;
      } else {
        turnInstruction.innerHTML = `⚾ <b>Your Turn to BOWL!</b> Guess batsman's fingers to get him OUT:`;
      }
    } else {
      controlsSection.style.display = 'none';
      spectatorNotice.style.display = 'block';
      if (myRole === 'spectator') {
        spectatorNotice.innerHTML = `
          <div style="font-size: 1.15rem; font-weight: 900; color: var(--accent-gold);">👀 LIVE SPECTATOR BROADCAST</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Watching <b>${batPlayer ? batPlayer.name : 'Batsman'}</b> bat against <b>${bowlPlayer ? bowlPlayer.name : 'Bowler'}</b>! Cheer with emojis!</div>
        `;
      } else {
        spectatorNotice.innerHTML = `
          <div style="font-size: 1.15rem; font-weight: 900; color: var(--accent-cyan);">🏏 SQUAD DUGOUT</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Waiting for your turn. <b>${batPlayer ? batPlayer.name : ''}</b> is currently in the middle!</div>
        `;
      }
    }
  }

  function handleBallReveal(result, room) {
    if (revealTimer) clearTimeout(revealTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    const batName = result.batsmanName || (room.currentBatsman ? room.currentBatsman.name : 'Batsman');
    const bowlName = result.bowlerName || (room.currentBowler ? room.currentBowler.name : 'Bowler');

    if (batsmanHandLabel) batsmanHandLabel.textContent = `🏏 ${batName}`;
    if (bowlerHandLabel) bowlerHandLabel.textContent = `${bowlName} ⚾`;

    const batHand = batsmanHandSlot.querySelector('.hand-svg');
    const bowlHand = bowlerHandSlot.querySelector('.hand-svg');
    if (batHand) batHand.classList.add('hand-countdown');
    if (bowlHand) bowlHand.classList.add('hand-countdown');

    pitchStatus.textContent = '1... 2... 3... REVEAL!';
    SoundEngine.playReveal();

    setTimeout(() => {
      batsmanHandSlot.innerHTML = HandRenderer.getHandSVG(result.batMove, 'batsman', true);
      bowlerHandSlot.innerHTML = HandRenderer.getHandSVG(result.bowlMove, 'bowler', true);

      batsmanStatusPill.textContent = HandRenderer.getMoveLabel(result.batMove);
      batsmanStatusPill.className = 'hand-status-pill revealed';
      bowlerStatusPill.textContent = HandRenderer.getMoveLabel(result.bowlMove);
      bowlerStatusPill.className = 'hand-status-pill revealed';

      if (result.isOut) {
        resultBadge.className = 'result-badge out';
        resultBadge.textContent = 'OUT! 🔴';
        resultDetailText.textContent = `☝️ ${batName} OUT! Both players showed ${result.batMove}!`;
        SoundEngine.playOut();
      } else if (result.batMove === 6) {
        resultBadge.className = 'result-badge six';
        resultBadge.textContent = 'SIX! 👍';
        resultDetailText.textContent = `💥 SIXER! ${batName}: 6 vs ${bowlName}: ${result.bowlMove}`;
        SoundEngine.playSixBoom();
      } else if (result.batMove === 10) {
        resultBadge.className = 'result-badge ten';
        resultBadge.textContent = 'PUNCH 10! 👊';
        resultDetailText.textContent = `💣 SUPER PUNCH! ${batName}: 10 vs ${bowlName}: ${result.bowlMove}`;
        SoundEngine.playPunch10();
      } else {
        resultBadge.className = 'result-badge runs';
        resultBadge.textContent = `+${result.runs} RUNS`;
        resultDetailText.textContent = `🏏 ${batName}: ${result.batMove} fingers vs ${bowlName}: ${result.bowlMove} fingers`;
        SoundEngine.playBatShot();
      }

      ballResultOverlay.style.display = 'block';

      let secondsLeft = 4;
      nextBallTimer.textContent = `Agli ball ${secondsLeft}s mein...`;
      countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
          nextBallTimer.textContent = `Agli ball ${secondsLeft}s mein...`;
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);

      revealTimer = setTimeout(() => {
        if (room.gamePhase === 'playing') {
          setupGameArena(room);
        }
      }, 4000);

    }, 800);
  }

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration error', err));
  }
});
