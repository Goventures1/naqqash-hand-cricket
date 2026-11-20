// NAQQASH - MULTIPLAYER FAMILY GAMING PLATFORM CLIENT CONTROLLER
// Complete Engine: Hand Cricket, Snake & Ladders (30 Players), Classic Ludo (4 Players),
// Admin Authentication (Naqqash Only), Coins & Betting System, Big Clear Banners & Popups

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_SERVER_URL = 'https://naqqash-hand-cricket.onrender.com';
  const SERVER_CONFIG_VERSION = 'v7_naqqash_master';

  // Avatars
  const AVATARS = ['🐯', '🦁', '🐉', '🦅', '🐺', '👑', '⚔️', '🧙', '🤖', '🚀', '⚡', '💎'];

  // User & Room State
  let myPlayerName = localStorage.getItem('naqqash_player_name') || '';
  let myAvatar = localStorage.getItem('naqqash_avatar') || '🐯';
  let myRole = 'player';
  let currentRoom = null;
  let selectedGameType = 'snake';
  let isSoundMuted = localStorage.getItem('naqqash_sound_muted') === 'true';
  let currentUser = null; // { username, role, coins }

  // Load saved auth user if available
  try {
    const savedUser = localStorage.getItem('naqqash_auth_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      myPlayerName = currentUser.username;
    }
  } catch (e) {
    console.error('Error restoring auth:', e);
  }

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

  // ========================================================
  // DOM ELEMENTS
  // ========================================================
  const headerHomeBtn = document.getElementById('headerHomeBtn');
  const backBtn = document.getElementById('backBtn');
  const roomBadge = document.getElementById('roomBadge');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const connStatusPill = document.getElementById('connStatusPill');
  const connStatusText = document.getElementById('connStatusText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const serverConfigBtn = document.getElementById('serverConfigBtn');

  // Auth & Admin Header Elements
  const headerCoinsPill = document.getElementById('headerCoinsPill');
  const headerCoinsDisplay = document.getElementById('headerCoinsDisplay');
  const headerUserBadge = document.getElementById('headerUserBadge');
  const headerUsername = document.getElementById('headerUsername');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const headerAdminBtn = document.getElementById('headerAdminBtn');
  const headerStatsBtn = document.getElementById('headerStatsBtn');
  const headerLeaderboardBtn = document.getElementById('headerLeaderboardBtn');
  const headerLogoutBtn = document.getElementById('headerLogoutBtn');
  const onlineCountBadge = document.getElementById('onlineCountBadge');

  // Views
  const homeScreen = document.getElementById('homeScreen');
  const roomLobbyView = document.getElementById('roomLobbyView');
  const snakeGameView = document.getElementById('snakeGameView');
  const cricketGameView = document.getElementById('cricketGameView');
  const ludoGameView = document.getElementById('ludoGameView');

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
  const betAmountSelect = document.getElementById('betAmountSelect');
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

  // Auth Modals
  const loginModal = document.getElementById('loginModal');
  const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
  const loginUsernameInput = document.getElementById('loginUsernameInput');
  const loginPasswordInput = document.getElementById('loginPasswordInput');
  const submitLoginBtn = document.getElementById('submitLoginBtn');
  const loginErrorMsg = document.getElementById('loginErrorMsg');

  // Admin Modals
  const adminModal = document.getElementById('adminModal');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const adminTabUsersBtn = document.getElementById('adminTabUsersBtn');
  const adminTabCreateBtn = document.getElementById('adminTabCreateBtn');
  const adminTabAllotBtn = document.getElementById('adminTabAllotBtn');
  const adminTabUsers = document.getElementById('adminTabUsers');
  const adminTabCreate = document.getElementById('adminTabCreate');
  const adminTabAllot = document.getElementById('adminTabAllot');
  const adminUsersTableBody = document.getElementById('adminUsersTableBody');
  const newUsernameInput = document.getElementById('newUsernameInput');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const newInitialCoinsInput = document.getElementById('newInitialCoinsInput');
  const adminCreateUserSubmitBtn = document.getElementById('adminCreateUserSubmitBtn');
  const adminCreateUserErrorMsg = document.getElementById('adminCreateUserErrorMsg');
  const allotTargetUserInput = document.getElementById('allotTargetUserInput');
  const allotActionSelect = document.getElementById('allotActionSelect');
  const allotAmountInput = document.getElementById('allotAmountInput');
  const adminAllotCoinsSubmitBtn = document.getElementById('adminAllotCoinsSubmitBtn');
  const adminAllotErrorMsg = document.getElementById('adminAllotErrorMsg');

  // Global Leaderboard Modal
  const leaderboardModal = document.getElementById('leaderboardModal');
  const closeLeaderboardModalBtn = document.getElementById('closeLeaderboardModalBtn');
  const leaderboardTableBody = document.getElementById('leaderboardTableBody');

  // Online Players Modal
  const onlinePlayersModal = document.getElementById('onlinePlayersModal');
  const closeOnlineModalBtn = document.getElementById('closeOnlineModalBtn');
  const onlineCountTitle = document.getElementById('onlineCountTitle');
  const onlinePlayersList = document.getElementById('onlinePlayersList');

  // Stats Modal
  const statsModal = document.getElementById('statsModal');
  const closeStatsModalBtn = document.getElementById('closeStatsModalBtn');
  const statsContent = document.getElementById('statsContent');

  // Waiting Room Elements
  const lobbyGameBadge = document.getElementById('lobbyGameBadge');
  const lobbyBetBadge = document.getElementById('lobbyBetBadge');
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

  // Cricket Arena Elements
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
  const cricketBatsmanScoreDisplay = document.getElementById('cricketBatsmanScoreDisplay');
  const cricketBowlerOverDisplay = document.getElementById('cricketBowlerOverDisplay');
  const cricketPicksIndicator = document.getElementById('cricketPicksIndicator');
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

  // Big Ball Result Popup
  const cricketBallPopup = document.getElementById('cricketBallPopup');
  const ballResultCard = document.getElementById('ballResultCard');
  const ballResultTitle = document.getElementById('ballResultTitle');
  const ballResultSub = document.getElementById('ballResultSub');
  const popupBatMove = document.getElementById('popupBatMove');
  const popupBowlMove = document.getElementById('popupBowlMove');

  // Ludo Arena Elements
  const ludoBoardMount = document.getElementById('ludoBoardMount');
  const ludoRollBtn = document.getElementById('ludoRollBtn');

  // Coin Transfer Animation Elements
  const coinTransferOverlay = document.getElementById('coinTransferOverlay');
  const transferLoserName = document.getElementById('transferLoserName');
  const transferLoserDelta = document.getElementById('transferLoserDelta');
  const transferWinnerName = document.getElementById('transferWinnerName');
  const transferWinnerDelta = document.getElementById('transferWinnerDelta');
  const transferSubText = document.getElementById('transferSubText');
  const transferFooterNote = document.getElementById('transferFooterNote');

  // ========================================================
  // INITIAL USER INTERFACE STATE
  // ========================================================
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

  // Update Auth UI according to currentUser
  function updateAuthUI() {
    if (currentUser) {
      headerLoginBtn.style.display = 'none';
      headerUserBadge.style.display = 'inline-flex';
      headerUsername.textContent = currentUser.username;
      headerCoinsPill.style.display = 'inline-flex';
      headerCoinsDisplay.textContent = (currentUser.coins || 0).toLocaleString();
      headerStatsBtn.style.display = 'inline-flex';
      headerLogoutBtn.style.display = 'inline-flex';

      // FORCE player name to always match their login username!
      myPlayerName = currentUser.username;
      localStorage.setItem('naqqash_player_name', myPlayerName);
      if (playerNameInput) {
        playerNameInput.value = currentUser.username;
        playerNameInput.disabled = true;
        playerNameInput.style.opacity = '0.75';
        playerNameInput.title = 'Player name is locked to your Login Username';
      }
      if (modalPlayerNameInput) {
        modalPlayerNameInput.value = currentUser.username;
        modalPlayerNameInput.disabled = true;
        modalPlayerNameInput.style.opacity = '0.75';
      }

      if (currentUser.username.toLowerCase() === 'naqqash') {
        headerAdminBtn.style.display = 'inline-flex';
      } else {
        headerAdminBtn.style.display = 'none';
      }
    } else {
      headerLoginBtn.style.display = 'inline-flex';
      headerUserBadge.style.display = 'none';
      headerCoinsPill.style.display = 'none';
      headerAdminBtn.style.display = 'none';
      headerStatsBtn.style.display = 'none';
      headerLogoutBtn.style.display = 'none';

      if (playerNameInput) {
        playerNameInput.disabled = false;
        playerNameInput.style.opacity = '1';
      }
      if (modalPlayerNameInput) {
        modalPlayerNameInput.disabled = false;
        modalPlayerNameInput.style.opacity = '1';
      }
    }
  }

  updateAuthUI();

  // If saved user, attempt re-login on connect
  function autoRelogin() {
    if (currentUser && currentUser.username && socket && socket.connected) {
      socket.emit('auth_restore', { username: currentUser.username });
      socket.emit('get_my_stats');
    }
  }

  // ========================================================
  // VIEW NAVIGATION SYSTEM
  // ========================================================
  function showView(viewId) {
    [homeScreen, roomLobbyView, snakeGameView, cricketGameView, ludoGameView].forEach(v => {
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

  // ========================================================
  // AUTHENTICATION & ADMIN CONTROLS
  // ========================================================
  headerLoginBtn.addEventListener('click', () => {
    loginErrorMsg.style.display = 'none';
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    loginModal.style.display = 'flex';
  });

  closeLoginModalBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });

  submitLoginBtn.addEventListener('click', () => {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!username || !password) {
      loginErrorMsg.textContent = 'Please enter both username and password!';
      loginErrorMsg.style.display = 'block';
      return;
    }
    if (socket) {
      socket.emit('auth_login', { username, password });
    }
  });

  headerLogoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      currentUser = null;
      localStorage.removeItem('naqqash_auth_user');
      updateAuthUI();
    }
  });

  // Admin Modal Opening
  headerAdminBtn.addEventListener('click', () => {
    adminModal.style.display = 'flex';
    switchAdminTab('users');
    if (socket) socket.emit('admin_get_users');
  });

  closeAdminModalBtn.addEventListener('click', () => {
    adminModal.style.display = 'none';
  });

  // Admin Tabs
  adminTabUsersBtn.addEventListener('click', () => {
    switchAdminTab('users');
    if (socket) socket.emit('admin_get_users');
  });
  adminTabCreateBtn.addEventListener('click', () => switchAdminTab('create'));
  adminTabAllotBtn.addEventListener('click', () => switchAdminTab('allot'));

  function switchAdminTab(tab) {
    adminTabUsers.style.display = tab === 'users' ? 'block' : 'none';
    adminTabCreate.style.display = tab === 'create' ? 'block' : 'none';
    adminTabAllot.style.display = tab === 'allot' ? 'block' : 'none';

    adminTabUsersBtn.style.borderColor = tab === 'users' ? '#38bdf8' : 'transparent';
    adminTabCreateBtn.style.borderColor = tab === 'create' ? '#38bdf8' : 'transparent';
    adminTabAllotBtn.style.borderColor = tab === 'allot' ? '#38bdf8' : 'transparent';
  }

  // Admin: Create User
  adminCreateUserSubmitBtn.addEventListener('click', () => {
    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value.trim();
    const initialCoins = parseInt(newInitialCoinsInput.value) || 1000;

    if (!username || !password) {
      adminCreateUserErrorMsg.textContent = 'Username and password required!';
      adminCreateUserErrorMsg.style.display = 'block';
      return;
    }
    adminCreateUserErrorMsg.style.display = 'none';
    if (socket) {
      socket.emit('admin_create_user', { username, password, initialCoins });
    }
  });

  // Admin: Allot Coins
  adminAllotCoinsSubmitBtn.addEventListener('click', () => {
    const targetUsername = allotTargetUserInput.value.trim();
    const amount = parseInt(allotAmountInput.value);
    const action = allotActionSelect ? allotActionSelect.value : 'add';

    if (!targetUsername || isNaN(amount)) {
      adminAllotErrorMsg.textContent = 'Valid username and coin amount required!';
      adminAllotErrorMsg.style.display = 'block';
      return;
    }
    adminAllotErrorMsg.style.display = 'none';
    if (socket) {
      socket.emit('admin_allot_coins', { targetUsername, amount, action });
    }
  });

  // Quick Coin Preset Buttons
  document.querySelectorAll('.quick-coin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amt = btn.getAttribute('data-amt');
      const act = btn.getAttribute('data-act');
      if (allotAmountInput) allotAmountInput.value = amt;
      if (allotActionSelect) allotActionSelect.value = act;
    });
  });

  // Global Leaderboard Modal
  headerLeaderboardBtn.addEventListener('click', () => {
    leaderboardModal.style.display = 'flex';
    if (socket) socket.emit('get_leaderboard');
  });

  closeLeaderboardModalBtn.addEventListener('click', () => {
    leaderboardModal.style.display = 'none';
  });

  // Online Players Modal
  connStatusPill.addEventListener('click', () => {
    onlinePlayersModal.style.display = 'flex';
    if (socket) socket.emit('get_online_players');
  });

  closeOnlineModalBtn.addEventListener('click', () => {
    onlinePlayersModal.style.display = 'none';
  });

  // Career Stats Modal
  headerStatsBtn.addEventListener('click', () => {
    statsModal.style.display = 'flex';
    if (socket) socket.emit('get_my_stats');
  });
  closeStatsModalBtn.addEventListener('click', () => {
    statsModal.style.display = 'none';
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
                                   gameType === 'ludo' ? 'CREATE LUDO CLASSIC ROOM' : 'CREATE HAND CRICKET ROOM';
    modalPlayerNameInput.value = currentUser ? currentUser.username : (myPlayerName || playerNameInput.value || '');
    cricketCreateOptions.style.display = gameType === 'cricket' ? 'block' : 'none';
    createRoomModal.style.display = 'flex';
  }

  closeCreateModalBtn.addEventListener('click', () => {
    createRoomModal.style.display = 'none';
  });

  confirmCreateRoomBtn.addEventListener('click', () => {
    const pName = modalPlayerNameInput.value.trim() || (currentUser ? currentUser.username : `Player ${Math.floor(Math.random() * 90 + 10)}`);
    myPlayerName = pName;
    localStorage.setItem('naqqash_player_name', myPlayerName);

    const betAmount = parseInt(betAmountSelect.value) || 0;

    if (socket) {
      socket.emit('create_room', {
        playerName: pName,
        gameType: selectedGameType,
        avatar: myAvatar,
        betAmount,
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
    const pName = currentUser ? currentUser.username : (myPlayerName || playerNameInput.value.trim() || `Cousin ${Math.floor(Math.random() * 90 + 10)}`);
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
      autoRelogin();
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

    // Auth events
    s.on('auth_success', ({ user }) => {
      currentUser = user;
      localStorage.setItem('naqqash_auth_user', JSON.stringify(user));
      updateAuthUI();
      loginModal.style.display = 'none';
      alert(`Welcome, ${user.username}! Login successful.`);
    });

    s.on('auth_error', (msg) => {
      loginErrorMsg.textContent = msg;
      loginErrorMsg.style.display = 'block';
    });

    s.on('user_coins_changed', ({ username, coins }) => {
      if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
        currentUser.coins = coins;
        localStorage.setItem('naqqash_auth_user', JSON.stringify(currentUser));
        updateAuthUI();
      }
    });

    // Admin events
    s.on('admin_users_list', ({ users }) => {
      renderAdminUsersTable(users);
    });

    s.on('admin_user_created', ({ user, allUsers }) => {
      alert(`✅ User "${user.username}" created successfully with ${user.coins} coins!`);
      newUsernameInput.value = '';
      newPasswordInput.value = '';
      renderAdminUsersTable(allUsers);
      switchAdminTab('users');
    });

    s.on('admin_coins_updated', ({ targetUsername, newCoins, allUsers }) => {
      alert(`💰 Successfully updated coins for "${targetUsername}". New balance: ${newCoins}`);
      allotTargetUserInput.value = '';
      allotAmountInput.value = '';
      renderAdminUsersTable(allUsers);
      switchAdminTab('users');
    });

    s.on('admin_user_deleted', ({ deletedUsername, allUsers }) => {
      alert(`🗑️ User "${deletedUsername}" has been removed successfully.`);
      renderAdminUsersTable(allUsers);
    });

    s.on('online_count', ({ count }) => {
      if (onlineCountBadge) onlineCountBadge.textContent = count;
      if (onlineCountTitle) onlineCountTitle.textContent = count;
    });

    s.on('online_players_list', ({ players }) => {
      renderOnlinePlayers(players);
    });

    s.on('leaderboard_data', ({ leaderboard }) => {
      renderLeaderboardTable(leaderboard);
    });

    // Stats event
    s.on('my_stats', ({ stats, coins }) => {
      renderStatsModal(stats, coins);
    });

    // Room events
    s.on('room_created', ({ room, myPlayerId }) => {
      handleRoomEntered(room, myPlayerId);
    });

    s.on('joined_successfully', ({ room, myPlayerId }) => {
      handleRoomEntered(room, myPlayerId);
    });

    s.on('room_updated', ({ room }) => {
      updateRoomState(room);
    });

    // Snake events
    s.on('snake_game_started', ({ room }) => {
      currentRoom = room;
      initSnakeArena(room);
    });

    s.on('snake_dice_rolled', ({ rollResult, room }) => {
      currentRoom = room;
      handleSnakeRollResult(rollResult, room);
    });

    // Cricket events
    s.on('ball_completed', ({ result, room }) => {
      currentRoom = room;
      handleCricketBall(result, room);
    });

    s.on('pick_locked', ({ hasBatPicked, hasBowlPicked }) => {
      if (cricketPicksIndicator) {
        if (hasBatPicked && hasBowlPicked) {
          cricketPicksIndicator.textContent = '⚡ RESOLVING BALL...';
        } else if (hasBatPicked) {
          cricketPicksIndicator.textContent = '🏏 Batsman ready!';
        } else if (hasBowlPicked) {
          cricketPicksIndicator.textContent = '⚾ Bowler ready!';
        } else {
          cricketPicksIndicator.textContent = 'Waiting for picks...';
        }
      }
    });

    s.on('toss_completed', ({ tossResult, winnerKey, winnerName, room }) => {
      currentRoom = room;
      handleCricketToss(tossResult, winnerKey, winnerName, room);
    });

    // Ludo events
    s.on('ludo_game_started', ({ room }) => {
      currentRoom = room;
      initLudoArena(room);
    });

    s.on('ludo_dice_rolled', ({ roll, eligibleTokens, room }) => {
      currentRoom = room;
      SoundEngine.playDiceRoll();
      if (typeof LudoClient !== 'undefined') {
        LudoClient.updateTokens(room.ludoState, socket.id);
      }
    });

    s.on('ludo_token_moved', ({ moveResult, room }) => {
      currentRoom = room;
      if (moveResult.captured) {
        SoundEngine.playOutWhistle();
      } else {
        SoundEngine.playTokenHop();
      }
      if (typeof LudoClient !== 'undefined') {
        LudoClient.updateTokens(room.ludoState, socket.id);
      }
      if (room.gamePhase === 'match_over') {
        showResultsModal(room);
      }
    });

    // Coin Transfer Animation Event
    s.on('coin_transfer_event', ({ transfers, reason, leaverName, winnerName, commentary }) => {
      handleCoinTransferAnimation(transfers, reason, leaverName, winnerName);
    });
  }

  function handleCoinTransferAnimation(transfers, reason, leaverName, winnerName) {
    if (!coinTransferOverlay || !transfers || transfers.length === 0) return;
    const t = transfers[0];

    if (transferLoserName) transferLoserName.textContent = t.fromName || 'Loser';
    if (transferLoserDelta) transferLoserDelta.textContent = `-${t.amount} 🪙`;
    if (transferWinnerName) transferWinnerName.textContent = t.toName || 'Winner';
    if (transferWinnerDelta) transferWinnerDelta.textContent = `+${t.amount} 🪙`;

    if (transferSubText) {
      if (reason === 'forfeit') {
        transferSubText.textContent = `⚠️ ${t.fromName} match chorr kar chala gaya! Forfeit coins transfer ho gaye!`;
      } else {
        transferSubText.textContent = `Match khatam! ${t.amount} bet coins jeetne walay k account mein transfer ho rahay hain!`;
      }
    }

    if (transferFooterNote) {
      transferFooterNote.textContent = `💰 ${t.amount} coins transfer: ${t.fromName} ➔ ${t.toName}!`;
    }

    coinTransferOverlay.style.display = 'flex';
    SoundEngine.playCoinJingle();

    setTimeout(() => {
      coinTransferOverlay.style.display = 'none';
    }, 4200);
  }

  if (coinTransferOverlay) {
    coinTransferOverlay.addEventListener('click', () => {
      coinTransferOverlay.style.display = 'none';
    });
  }

  bindSocketEvents(socket);

  // Render Admin Users Directory
  function renderAdminUsersTable(users) {
    if (!users || !adminUsersTableBody) return;
    let rows = '';
    users.forEach(u => {
      const isNaqqash = u.username.toLowerCase() === 'naqqash';
      const deleteActionHtml = isNaqqash
        ? '<span style="color: #64748b; font-size: 0.78rem;">Super Admin</span>'
        : `<button class="header-btn admin-del-btn" data-user="${u.username}" style="padding: 3px 8px; font-size: 0.75rem; border-color: #ef4444; color: #f87171;">🗑️ Delete</button>`;

      rows += `
        <tr>
          <td><b>${u.username}</b> ${isNaqqash ? '👑' : ''}</td>
          <td><span style="color: ${isNaqqash ? '#facc15' : '#38bdf8'};">${u.role.toUpperCase()}</span></td>
          <td><b style="color: #fde68a;">${(u.coins || 0).toLocaleString()}</b></td>
          <td>${u.stats ? u.stats.matchesPlayed : 0}</td>
          <td>${u.stats ? u.stats.matchesWon : 0}</td>
          <td>${deleteActionHtml}</td>
        </tr>
      `;
    });
    adminUsersTableBody.innerHTML = rows;

    adminUsersTableBody.querySelectorAll('.admin-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-user');
        if (confirm(`Are you sure you want to permanently delete user "${target}"?`)) {
          if (socket) socket.emit('admin_delete_user', { targetUsername: target });
        }
      });
    });
  }

  // Render Global Leaderboard & Scores
  function renderLeaderboardTable(leaderboard) {
    if (!leaderboardTableBody) return;
    if (!leaderboard || leaderboard.length === 0) {
      leaderboardTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No player records found yet.</td></tr>';
      return;
    }
    let rows = '';
    leaderboard.forEach(p => {
      const isNaqqash = p.username.toLowerCase() === 'naqqash';
      const isMe = currentUser && p.username.toLowerCase() === currentUser.username.toLowerCase();
      let rankBadge = `#${p.rank}`;
      if (p.rank === 1) rankBadge = '🥇 #1';
      else if (p.rank === 2) rankBadge = '🥈 #2';
      else if (p.rank === 3) rankBadge = '🥉 #3';

      const st = p.stats || {};
      rows += `
        <tr style="${isMe ? 'background: rgba(56, 189, 248, 0.12);' : ''}">
          <td style="font-weight: 700; color: ${p.rank <= 3 ? '#facc15' : '#94a3b8'};">${rankBadge}</td>
          <td>
            <b>${p.username}</b> ${isNaqqash ? '👑' : ''} ${isMe ? '<span style="color:#38bdf8; font-size: 0.72rem; font-weight: 700;">(You)</span>' : ''}
          </td>
          <td><b style="color: #fde68a;">${(p.coins || 0).toLocaleString()}</b></td>
          <td><b style="color: #34d399;">${st.matchesWon || 0}</b> / <span style="color: #94a3b8;">${st.matchesPlayed || 0}</span></td>
          <td style="color: #67e8f9;">${st.runsScored || 0}</td>
          <td style="color: #f472b6;">${st.wicketsTaken || 0}</td>
          <td style="color: #a78bfa;">${st.snakeWins || 0}</td>
          <td style="color: #fb923c;">${st.ludoWins || 0}</td>
        </tr>
      `;
    });
    leaderboardTableBody.innerHTML = rows;
  }

  // Render Live Online Players
  function renderOnlinePlayers(players) {
    if (!onlinePlayersList) return;
    if (!players || players.length === 0) {
      onlinePlayersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 14px;">No other players online right now.</p>';
      return;
    }
    let html = '';
    players.forEach(p => {
      const isMe = p.username && currentUser && p.username.toLowerCase() === currentUser.username.toLowerCase();
      const isNaqqash = p.username && p.username.toLowerCase() === 'naqqash';
      const locationText = p.roomCode ? `In Room #${p.roomCode} (${(p.gameType || 'game').toUpperCase()})` : 'In Main Lobby 🏠';
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.4rem;">${p.avatar || '🎮'}</span>
            <div>
              <div style="font-weight: 700; color: ${isNaqqash ? '#facc15' : '#e2e8f0'};">
                ${p.username} ${isNaqqash ? '👑' : ''} ${isMe ? '<span style="color:#38bdf8; font-size:0.75rem;">(You)</span>' : ''}
              </div>
              <div style="font-size: 0.78rem; color: #94a3b8;">${locationText}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 6px #10b981;"></span>
            <span style="font-size: 0.78rem; color: #34d399; font-weight: 600;">ONLINE</span>
          </div>
        </div>
      `;
    });
    onlinePlayersList.innerHTML = html;
  }

  // Render Career Statistics
  function renderStatsModal(stats, coins) {
    if (!statsContent) return;
    const played = stats.matchesPlayed || 0;
    const won = stats.matchesWon || 0;
    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

    statsContent.innerHTML = `
      <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">COIN BALANCE</div>
        <div style="font-size: 1.8rem; font-weight: 900; color: #fde68a;">💰 ${(coins || 0).toLocaleString()} Coins</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
        <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 0.72rem; color: var(--text-muted);">MATCHES PLAYED</div>
          <div style="font-size: 1.4rem; font-weight: 900;">${played}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 0.72rem; color: #10b981;">MATCHES WON</div>
          <div style="font-size: 1.4rem; font-weight: 900; color: #34d399;">${won} (${winRate}%)</div>
        </div>
      </div>

      <div style="font-size: 0.85rem; font-weight: 800; color: var(--accent-cyan); margin-bottom: 8px;">GAME STATS:</div>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between;"><span>🏏 Cricket Runs:</span> <b>${stats.cricketRuns || 0}</b></div>
        <div style="display: flex; justify-content: space-between;"><span>⚾ Cricket Wickets:</span> <b>${stats.cricketWickets || 0}</b></div>
        <div style="display: flex; justify-content: space-between;"><span>🐍 Snake & Ladders Wins:</span> <b>${stats.snakeWins || 0}</b></div>
        <div style="display: flex; justify-content: space-between;"><span>🎲 Ludo Classic Wins:</span> <b>${stats.ludoWins || 0}</b></div>
      </div>
    `;
  }

  // Room Joined / Created Entry point
  function handleRoomEntered(room, myPlayerId) {
    currentRoom = room;
    selectedGameType = room.gameType || 'snake';

    lobbyRoomCode.textContent = room.code;
    lobbyGameBadge.textContent = (room.gameType || 'snake').toUpperCase();

    if (room.betAmount && room.betAmount > 0) {
      lobbyBetBadge.style.display = 'inline-flex';
      lobbyBetBadge.textContent = `💰 POT: ${((room.pot || (room.betAmount * room.players.length)) || 0).toLocaleString()} COINS`;
    } else {
      lobbyBetBadge.style.display = 'none';
    }

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

    // Host Controls
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

    // Active Game Routing
    if (room.gameType === 'snake' && room.gamePhase === 'playing') {
      updateSnakeArenaUI(room);
    } else if (room.gameType === 'cricket' && (room.gamePhase === 'playing' || room.gamePhase === 'toss')) {
      updateCricketArenaUI(room);
    } else if (room.gameType === 'ludo' && room.gamePhase === 'playing') {
      updateLudoArenaUI(room);
    }

    // Check Finished or Lobby state
    if (room.gamePhase === 'match_over') {
      showResultsModal(room);
    } else if (room.gamePhase === 'lobby') {
      if (gameResultsModal) gameResultsModal.style.display = 'none';
      showView('roomLobbyView');
    }
  }

  // ========================================================
  // SNAKE & LADDERS ARENA CONTROLLER
  // ========================================================
  function initSnakeArena(room) {
    showView('snakeGameView');
    snakeBoardMount.innerHTML = SnakeGame.renderBoardSVG();
    updateSnakeArenaUI(room);
  }

  function updateSnakeArenaUI(room) {
    if (!room.snakeState) return;

    SnakeGame.updateTokens(room.snakeState.players, room.snakeState.activePlayerId);

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

    // Update Live Race Leaderboard
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

  snakeRollBtn.addEventListener('click', () => {
    if (socket) {
      snakeRollBtn.disabled = true;
      socket.emit('snake_roll_dice');
    }
  });

  function handleSnakeRollResult(rollResult, room) {
    SnakeGame.rollDiceAnimation(rollResult.roll, () => {
      // Step-by-step slow hopping animation
      if (rollResult.stepPath && rollResult.stepPath.length > 0) {
        SnakeGame.animateTokenMovement(rollResult.playerId, rollResult.stepPath, rollResult.newPos, rollResult.eventType, () => {
          triggerSnakeEventSound(rollResult.eventType);
          snakeEventText.textContent = rollResult.bannerMsg;
          updateSnakeArenaUI(room);
        });
      } else {
        triggerSnakeEventSound(rollResult.eventType);
        snakeEventText.textContent = rollResult.bannerMsg;
        updateSnakeArenaUI(room);
      }
    });
  }

  function triggerSnakeEventSound(eventType) {
    if (eventType === 'unlocked') SoundEngine.playPlayerUnlock();
    else if (eventType === 'ladder') SoundEngine.playLadderClimb();
    else if (eventType === 'snake') SoundEngine.playSnakeSlide();
    else if (eventType === 'giant_99') SoundEngine.playGiantSnake();
    else if (eventType === 'win') SoundEngine.playWinnerFanfare();
    else if (eventType === 'normal') SoundEngine.playTokenHop();
  }

  // ========================================================
  // CRICKET ARENA CONTROLLER
  // ========================================================
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

    // Prominent Batsman & Bowler Name and Stats
    if (room.currentBatsman) {
      cricketBatsmanName.textContent = room.currentBatsman.name;
      cricketBatsmanScoreDisplay.textContent = `${room.currentBatsman.score || 0} runs (${room.currentBatsman.balls || 0} balls)`;
    }
    if (room.currentBowler) {
      cricketBowlerName.textContent = room.currentBowler.name;
      const bowlTeam = room[room.bowlingTeamKey];
      cricketBowlerOverDisplay.textContent = `Over: ${bowlTeam.overs || 0}.${bowlTeam.balls || 0}`;
    }

    if (room.commentary && room.commentary[0]) cricketCommentaryText.textContent = room.commentary[0];

    // Toss Phase
    if (room.gamePhase === 'toss') {
      cricketTossSection.style.display = 'block';
      cricketHandsStage.style.display = 'none';
      cricketPickSection.style.display = 'none';

      const toss = room.toss || {};
      const tossPromptEl = document.getElementById('cricketTossPrompt');

      if (!toss.winnerKey) {
        // Coin waiting to be called
        if (tossPromptEl) {
          tossPromptEl.innerHTML = `
            <div style="font-size: 1.2rem; color: #fde68a; font-weight: 800; margin-bottom: 6px;">🪙 COIN TOSS!</div>
            <div style="font-size: 0.92rem; color: #cbd5e1;">HEADS ya TAILS par click karke Toss call karein:</div>
          `;
        }
        cricketTossButtons.style.display = 'flex';
        cricketTossDecisionButtons.style.display = 'none';
      } else {
        // Toss completed!
        const isWinnerTeam = (room[toss.winnerKey] && room[toss.winnerKey].players.some(p => p.id === socket.id)) || room.hostId === socket.id;
        if (isWinnerTeam) {
          if (tossPromptEl) {
            tossPromptEl.innerHTML = `
              <div style="font-size: 1.3rem; color: #34d399; font-weight: 900; margin-bottom: 6px;">
                🎉 AAP TOSS JEET GAYE! (${(toss.coinResult || '').toUpperCase()})
              </div>
              <div style="font-size: 0.95rem; color: #fde68a; font-weight: 700;">
                Pehle BATTING karni hai ya BOWLING? Choose karein:
              </div>
            `;
          }
          cricketTossButtons.style.display = 'none';
          cricketTossDecisionButtons.style.display = 'flex';
        } else {
          if (tossPromptEl) {
            tossPromptEl.innerHTML = `
              <div style="font-size: 1.2rem; color: #38bdf8; font-weight: 800; margin-bottom: 6px;">
                🪙 ${toss.winnerName || 'Opponent'} Toss Jeet Gaya! (${(toss.coinResult || '').toUpperCase()})
              </div>
              <div style="font-size: 0.92rem; color: #94a3b8;">
                Unke Batting / Bowling faislay ka intezar ho raha hai...
              </div>
            `;
          }
          cricketTossButtons.style.display = 'none';
          cricketTossDecisionButtons.style.display = 'none';
        }
      }
    } else {
      cricketTossSection.style.display = 'none';
      cricketHandsStage.style.display = 'flex';
      cricketPickSection.style.display = 'block';
    }

    if (room.gamePhase === 'match_over') {
      showResultsModal(room);
    }
  }

  // Big Ball Result Popup Trigger
  function showBigBallPopup(result) {
    if (!cricketBallPopup) return;

    ballResultTitle.textContent = result.popupTitle || (result.isOut ? '🔴 WICKET! OUT!' : `⚡ ${result.runs} RUNS!`);
    ballResultSub.textContent = result.popupDetail || (result.isOut ? 'Both picked identical gestures!' : `Batsman scored ${result.runs} runs!`);

    popupBatMove.textContent = result.batMove === 6 ? '👍 6' : (result.batMove === 10 ? '👊 10' : result.batMove);
    popupBowlMove.textContent = result.bowlMove === 6 ? '👍 6' : (result.bowlMove === 10 ? '👊 10' : result.bowlMove);

    if (result.isOut) {
      ballResultCard.style.borderColor = '#ef4444';
      ballResultCard.style.boxShadow = '0 0 50px rgba(239, 68, 68, 0.5)';
      ballResultTitle.style.color = '#f87171';
    } else if (result.isSix || result.isPunch) {
      ballResultCard.style.borderColor = '#f59e0b';
      ballResultCard.style.boxShadow = '0 0 50px rgba(245, 158, 11, 0.5)';
      ballResultTitle.style.color = '#fde68a';
    } else {
      ballResultCard.style.borderColor = '#00f0ff';
      ballResultCard.style.boxShadow = '0 0 50px rgba(0, 240, 255, 0.4)';
      ballResultTitle.style.color = '#ffffff';
    }

    cricketBallPopup.style.display = 'flex';

    // Auto dismiss after 2.6 seconds
    setTimeout(() => {
      cricketBallPopup.style.display = 'none';
    }, 2600);
  }

  cricketBallPopup.addEventListener('click', () => {
    cricketBallPopup.style.display = 'none';
  });

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

    // Trigger Big Ball Result Popup!
    showBigBallPopup(result);

    updateCricketArenaUI(room);

    // CRITICAL FIX: If match finished on this ball, display Results Modal with PLAY AGAIN button!
    if (room.gamePhase === 'match_over') {
      setTimeout(() => {
        showResultsModal(room);
      }, 2400);
    }
  }

  function handleCricketToss(tossResult, winnerKey, winnerName, room) {
    SoundEngine.playDiceRoll();
    updateCricketArenaUI(room);
  }

  // ========================================================
  // CLASSIC LUDO ARENA CONTROLLER
  // ========================================================
  function initLudoArena(room) {
    showView('ludoGameView');
    if (typeof LudoClient !== 'undefined') {
      ludoBoardMount.innerHTML = LudoClient.renderBoardSVG();
      LudoClient.updateTokens(room.ludoState, socket.id);
    }
  }

  function updateLudoArenaUI(room) {
    if (!room.ludoState) return;
    if (typeof LudoClient !== 'undefined') {
      LudoClient.updateTokens(room.ludoState, socket.id);
    }
  }

  ludoRollBtn.addEventListener('click', () => {
    if (socket) {
      ludoRollBtn.disabled = true;
      socket.emit('ludo_roll_dice');
    }
  });

  window.onLudoTokenSelected = function(tokenIndex) {
    if (socket) {
      socket.emit('ludo_move_token', { tokenIndex });
    }
  };

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

      winners.forEach((w) => {
        const medal = w.rank === 1 ? '🥇' : (w.rank === 2 ? '🥈' : (w.rank === 3 ? '🥉' : '🎖️'));
        podiumHtml += `
          <div class="podium-card rank-${w.rank}">
            <div class="podium-rank-badge">${medal} #${w.rank}</div>
            <div class="podium-avatar">${w.avatar || '🐯'}</div>
            <div class="podium-name">${w.name}</div>
            <div class="podium-rolls">${w.totalRolls} Rolls</div>
          </div>
        `;
      });
      resultsPodium.innerHTML = podiumHtml;

      if (room.lastLoser) {
        lastLoserCard.style.display = 'block';
        lastLoserName.textContent = room.lastLoser.name;
        SoundEngine.playSadTrombone();
      } else {
        lastLoserCard.style.display = 'none';
        SoundEngine.playWinnerFanfare();
      }
    } else if (room.gameType === 'ludo') {
      const winner = room.winner || (room.ludoState && room.ludoState.winner);
      let podiumHtml = `
        <div class="podium-card rank-1">
          <div class="podium-rank-badge">🥇 CHAMPION</div>
          <div class="podium-avatar">👑</div>
          <div class="podium-name">${winner ? winner.name : 'Player'}</div>
          <div class="podium-rolls">Ludo Winner!</div>
        </div>
      `;
      resultsPodium.innerHTML = podiumHtml;
      lastLoserCard.style.display = 'none';
      SoundEngine.playWinnerFanfare();
    } else if (room.gameType === 'cricket') {
      const winner = room.winner;
      let podiumHtml = `
        <div class="podium-card rank-1">
          <div class="podium-rank-badge">🥇 WINNER</div>
          <div class="podium-avatar">🏏</div>
          <div class="podium-name">${winner ? winner.name : 'Winner'}</div>
          <div class="podium-rolls">${winner ? (winner.margin || 'Match Won!') : 'Victory!'}</div>
        </div>
      `;
      resultsPodium.innerHTML = podiumHtml;
      lastLoserCard.style.display = 'none';
      SoundEngine.playWinnerFanfare();
    }

    gameResultsModal.style.display = 'flex';
  }

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

  // Check URL parameters for direct room joining
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    quickRoomCodeInput.value = roomParam.toUpperCase();
    setTimeout(() => {
      joinWithCode();
    }, 500);
  }
});
