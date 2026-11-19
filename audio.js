// Premium Web Audio API Synthesizer for Naqqash Family Gaming Platform
// Zero external mp3 dependencies - synthesizes high-fidelity sound effects in real-time

const SoundEngine = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  setMuted(isMuted) {
    this.muted = !!isMuted;
    localStorage.setItem('naqqash_sound_muted', this.muted ? 'true' : 'false');
  },

  // UI Tick / Click
  playTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },

  // 1. DICE ROLL: Rapid tumbling rattle & table thud
  playDiceRoll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Series of quick rattle clicks
    for (let i = 0; i < 7; i++) {
      const clickTime = now + (i * 0.045) + (Math.random() * 0.015);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 600, clickTime);
      osc.frequency.exponentialRampToValueAtTime(150, clickTime + 0.03);
      gain.gain.setValueAtTime(0.25, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.01, clickTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(clickTime);
      osc.stop(clickTime + 0.03);
    }

    // Final table thud
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    const thudTime = now + 0.35;
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(160, thudTime);
    thudOsc.frequency.exponentialRampToValueAtTime(45, thudTime + 0.12);
    thudGain.gain.setValueAtTime(0.4, thudTime);
    thudGain.gain.exponentialRampToValueAtTime(0.01, thudTime + 0.12);
    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thudOsc.start(thudTime);
    thudOsc.stop(thudTime + 0.12);
  },

  // 2. TOKEN HOP: Woodblock step sound
  playTokenHop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  },

  // 3. LADDER CLIMB: Joyful ascending harp arpeggio
  playLadderClimb() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E4, G4, C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.08);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  },

  // 4. SNAKE SLIDE: Descending whirr + hiss
  playSnakeSlide() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pitch slide down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    // White noise hiss
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(now + 0.05);
  },

  // 5. GIANT 99 TITAN SNAKE: Deep 808 sub bass hit + terrifying roar slide
  playGiantSnake() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub bass drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.85);
    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.85);

    // Menacing saw slide
    const sawOsc = this.ctx.createOscillator();
    const sawGain = this.ctx.createGain();
    sawOsc.type = 'sawtooth';
    sawOsc.frequency.setValueAtTime(950, now);
    sawOsc.frequency.exponentialRampToValueAtTime(60, now + 0.9);
    sawGain.gain.setValueAtTime(0.35, now);
    sawGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
    sawOsc.connect(sawGain);
    sawGain.connect(this.ctx.destination);
    sawOsc.start(now);
    sawOsc.stop(now + 0.9);
  },

  // 6. PLAYER UNLOCKED: Celebratory Fanfare (when rolling a 1)
  playPlayerUnlock() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [
      { f: 440.00, t: 0 },    // A4
      { f: 554.37, t: 0.1 },  // C#5
      { f: 659.25, t: 0.2 },  // E5
      { f: 880.00, t: 0.3 }   // A5
    ];

    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);
      gain.gain.setValueAtTime(0.35, now + c.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + c.t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + c.t);
      osc.stop(now + c.t + 0.35);
    });
  },

  // 7. WINNER CELEBRATION: Grand fanfare & fireworks
  playWinnerFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 523.25, d: 0.12 }, // C5
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.35 }, // E5
      { f: 587.33, d: 0.15 }, // D5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.6 }   // G5
    ];

    let t = now;
    melody.forEach(m => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(m.f, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + m.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + m.d);
      t += m.d + 0.04;
    });
  },

  // 8. THE LAST LOSER: Comic sad trombone (Wah-Wah-Wah-Waaaaah)
  playLastLoser() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // D4, Db4, C4, B3 (descending with comic vibrato)
    const notes = [
      { f: 293.66, t: 0, d: 0.35 },
      { f: 277.18, t: 0.4, d: 0.35 },
      { f: 261.63, t: 0.8, d: 0.35 },
      { f: 246.94, t: 1.2, d: 0.85, slide: 200 }
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const noteStart = now + n.t;
      osc.frequency.setValueAtTime(n.f, noteStart);
      if (n.slide) {
        osc.frequency.linearRampToValueAtTime(n.slide, noteStart + n.d);
      }
      gain.gain.setValueAtTime(0.35, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + n.d);
    });
  },

  // CRICKET SOUNDS PRESERVED
  playBatShot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  },

  playOutWhistle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.linearRampToValueAtTime(1600, now + 0.2);
    osc.frequency.linearRampToValueAtTime(900, now + 0.45);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  },

  playCheer() {
    this.playWinnerFanfare();
  }
};

// Initialize mute from localStorage
try {
  SoundEngine.muted = localStorage.getItem('naqqash_sound_muted') === 'true';
} catch (e) {}
