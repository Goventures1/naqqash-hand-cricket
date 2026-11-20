// USER & COINS DATABASE MANAGER FOR NAQQASH ARENA
// Only Naqqash has admin authority to create IDs, passwords, and allot coins!

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Admin seed
const DEFAULT_ADMIN = {
  username: 'naqqash',
  password: 'ahmed01234',
  role: 'admin',
  coins: 50000,
  createdAt: Date.now(),
  stats: {
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    cricketRuns: 0,
    cricketWickets: 0,
    snakeWins: 0,
    ludoWins: 0,
    coinsWon: 0,
    coinsLost: 0
  }
};

class UserManager {
  constructor() {
    this.users = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const data = JSON.parse(raw);
        data.forEach(u => this.users.set(u.username.toLowerCase(), u));
      }
    } catch (e) {
      console.error('Error loading users.json:', e);
    }

    // Ensure Naqqash admin always exists with required password
    const adminUser = this.users.get('naqqash');
    if (!adminUser) {
      this.users.set('naqqash', { ...DEFAULT_ADMIN });
      this.save();
    } else {
      // Ensure admin password and role remain correct
      adminUser.password = 'ahmed01234';
      adminUser.role = 'admin';
      this.save();
    }
  }

  save() {
    try {
      const arr = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(arr, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving users.json:', e);
    }
  }

  // Authenticate user
  login(username, password) {
    if (!username || !password) return { success: false, error: 'Username and password required' };
    const u = this.users.get(username.trim().toLowerCase());
    if (!u) {
      return { success: false, error: 'User not found! Accounts can only be created by Admin Naqqash.' };
    }
    if (u.password !== password.trim()) {
      return { success: false, error: 'Incorrect password! Please ask Naqqash for correct login.' };
    }

    return {
      success: true,
      user: {
        username: u.username,
        role: u.role || 'player',
        coins: u.coins || 0,
        stats: u.stats || {}
      }
    };
  }

  // Naqqash Admin: Create user
  createUser(requesterUsername, { username, password, initialCoins }) {
    if ((requesterUsername || '').toLowerCase() !== 'naqqash') {
      return { success: false, error: 'Unauthorized! Only Admin Naqqash can create user accounts.' };
    }

    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!username || username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (!password || password.length < 3) {
      return { success: false, error: 'Password must be at least 3 characters' };
    }
    if (this.users.has(username)) {
      return { success: false, error: `User "${username}" already exists!` };
    }

    const newUser = {
      username,
      password,
      role: 'player',
      coins: parseInt(initialCoins) || 1000,
      createdAt: Date.now(),
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        cricketRuns: 0,
        cricketWickets: 0,
        snakeWins: 0,
        ludoWins: 0,
        coinsWon: 0,
        coinsLost: 0
      }
    };

    this.users.set(username, newUser);
    this.save();
    return { success: true, user: newUser };
  }

  // Naqqash Admin: Give / Allot / Deduct coins (Kam ya Ziada)
  allotCoins(requesterUsername, { targetUsername, amount, action = 'add' }) {
    if ((requesterUsername || '').toLowerCase() !== 'naqqash') {
      return { success: false, error: 'Unauthorized! Only Admin Naqqash can allot/deduct coins.' };
    }

    targetUsername = (targetUsername || '').trim().toLowerCase();
    const u = this.users.get(targetUsername);
    if (!u) {
      return { success: false, error: `User "${targetUsername}" not found!` };
    }

    const val = parseInt(amount);
    if (isNaN(val)) {
      return { success: false, error: 'Invalid coin amount' };
    }

    if (action === 'deduct') {
      // Kam karna
      u.coins = Math.max(0, (u.coins || 0) - Math.abs(val));
    } else if (action === 'set') {
      // Direct set
      u.coins = Math.max(0, val);
    } else {
      // Ziada karna (default add)
      if (val < 0) {
        u.coins = Math.max(0, (u.coins || 0) + val);
      } else {
        u.coins = (u.coins || 0) + val;
      }
    }

    this.save();
    return { success: true, username: u.username, newCoins: u.coins };
  }

  // Naqqash Admin: Delete / Remove User
  deleteUser(requesterUsername, targetUsername) {
    if ((requesterUsername || '').toLowerCase() !== 'naqqash') {
      return { success: false, error: 'Unauthorized! Only Admin Naqqash can remove users.' };
    }

    targetUsername = (targetUsername || '').trim().toLowerCase();
    if (targetUsername === 'naqqash') {
      return { success: false, error: 'Cannot delete Super Admin Naqqash!' };
    }

    if (!this.users.has(targetUsername)) {
      return { success: false, error: `User "${targetUsername}" does not exist!` };
    }

    this.users.delete(targetUsername);
    this.save();
    return { success: true, deletedUsername: targetUsername, allUsers: this.getAllUsers('naqqash') };
  }

  // Public Global Leaderboard (Everyone can see everyone's stats and scores)
  getPublicLeaderboard() {
    return Array.from(this.users.values()).map(u => ({
      username: u.username,
      role: u.role || 'player',
      coins: u.coins || 0,
      stats: u.stats || {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        cricketRuns: 0,
        cricketWickets: 0,
        snakeWins: 0,
        ludoWins: 0
      }
    })).sort((a, b) => {
      // Sort by matches won first, then coins
      const aWins = (a.stats && a.stats.matchesWon) || 0;
      const bWins = (b.stats && b.stats.matchesWon) || 0;
      if (bWins !== aWins) return bWins - aWins;
      return (b.coins || 0) - (a.coins || 0);
    });
  }

  // Get user details
  getUser(username) {
    return this.users.get((username || '').trim().toLowerCase()) || null;
  }

  // Update coin balance after matches
  adjustCoins(username, delta) {
    const u = this.users.get((username || '').trim().toLowerCase());
    if (!u) return 0;
    u.coins = Math.max(0, (u.coins || 0) + delta);
    if (delta > 0) {
      u.stats.coinsWon = (u.stats.coinsWon || 0) + delta;
    } else {
      u.stats.coinsLost = (u.stats.coinsLost || 0) + Math.abs(delta);
    }
    this.save();
    return u.coins;
  }

  // Transfer coins directly between loser and winner
  transferCoins(fromUsername, toUsername, amount) {
    fromUsername = (fromUsername || '').trim().toLowerCase();
    toUsername = (toUsername || '').trim().toLowerCase();
    amount = Math.max(0, parseInt(amount) || 0);

    const fromUser = this.users.get(fromUsername);
    const toUser = this.users.get(toUsername);

    if (!fromUser || !toUser || amount <= 0) {
      return { success: false, error: 'Invalid transfer details' };
    }

    const actualAmount = Math.min(fromUser.coins || 0, amount);
    fromUser.coins = Math.max(0, (fromUser.coins || 0) - actualAmount);
    toUser.coins = (toUser.coins || 0) + actualAmount;

    if (!fromUser.stats) fromUser.stats = {};
    if (!toUser.stats) toUser.stats = {};

    fromUser.stats.coinsLost = (fromUser.stats.coinsLost || 0) + actualAmount;
    toUser.stats.coinsWon = (toUser.stats.coinsWon || 0) + actualAmount;

    this.save();
    return {
      success: true,
      from: fromUser.username,
      to: toUser.username,
      amount: actualAmount,
      fromNewCoins: fromUser.coins,
      toNewCoins: toUser.coins
    };
  }

  // Add in-game cricket runs / wickets without touching matchesPlayed
  addCricketInGameStats(username, { runs = 0, wickets = 0 }) {
    const u = this.users.get((username || '').trim().toLowerCase());
    if (!u) return;
    if (!u.stats) {
      u.stats = { matchesPlayed: 0, matchesWon: 0, matchesLost: 0, cricketRuns: 0, cricketWickets: 0, snakeWins: 0, ludoWins: 0, coinsWon: 0, coinsLost: 0 };
    }
    if (runs) u.stats.cricketRuns = (u.stats.cricketRuns || 0) + runs;
    if (wickets) u.stats.cricketWickets = (u.stats.cricketWickets || 0) + wickets;
    this.save();
  }

  // Record match finish outcome (called ONCE per completed match)
  recordMatchOutcome(username, { gameType, won }) {
    const u = this.users.get((username || '').trim().toLowerCase());
    if (!u) return;

    if (!u.stats) {
      u.stats = { matchesPlayed: 0, matchesWon: 0, matchesLost: 0, cricketRuns: 0, cricketWickets: 0, snakeWins: 0, ludoWins: 0, coinsWon: 0, coinsLost: 0 };
    }

    u.stats.matchesPlayed = (u.stats.matchesPlayed || 0) + 1;
    if (won) {
      u.stats.matchesWon = (u.stats.matchesWon || 0) + 1;
      if (gameType === 'snake') u.stats.snakeWins = (u.stats.snakeWins || 0) + 1;
      if (gameType === 'ludo') u.stats.ludoWins = (u.stats.ludoWins || 0) + 1;
    } else {
      u.stats.matchesLost = (u.stats.matchesLost || 0) + 1;
    }
    this.save();
  }

  // Legacy compatibility helper
  recordMatch(username, { gameType, won, runs = 0, wickets = 0 }) {
    if (runs || wickets) {
      this.addCricketInGameStats(username, { runs, wickets });
    }
    if (won !== undefined) {
      this.recordMatchOutcome(username, { gameType, won });
    }
  }

  // List all users for Naqqash's Admin Panel
  getAllUsers(requesterUsername) {
    if ((requesterUsername || '').toLowerCase() !== 'naqqash') return [];
    return Array.from(this.users.values()).map(u => ({
      username: u.username,
      password: u.password, // Naqqash can view / manage
      role: u.role,
      coins: u.coins,
      stats: u.stats,
      createdAt: u.createdAt
    }));
  }
}

module.exports = new UserManager();
