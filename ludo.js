// CLASSIC LUDO CLIENT BOARD & GAME RENDERER
// High-Definition 15x15 Vector Board, 4 Colors, Safe Stars, Token Animations & Turn Management

const LudoClient = {
  selectedToken: null,
  eligibleTokens: [],
  myColor: null,

  // Track coordinate mapping on a 15x15 grid (0 to 14)
  TRACK_COORDS: [
    { col: 1, row: 6 },   // 0: Red Start (Safe ⭐)
    { col: 2, row: 6 },   // 1
    { col: 3, row: 6 },   // 2
    { col: 4, row: 6 },   // 3
    { col: 5, row: 6 },   // 4
    { col: 6, row: 5 },   // 5
    { col: 6, row: 4 },   // 6
    { col: 6, row: 3 },   // 7
    { col: 6, row: 2 },   // 8 (Safe ⭐)
    { col: 6, row: 1 },   // 9
    { col: 6, row: 0 },   // 10
    { col: 7, row: 0 },   // 11 (Green End)
    { col: 8, row: 0 },   // 12
    { col: 8, row: 1 },   // 13: Green Start (Safe ⭐)
    { col: 8, row: 2 },   // 14
    { col: 8, row: 3 },   // 15
    { col: 8, row: 4 },   // 16
    { col: 8, row: 5 },   // 17
    { col: 9, row: 6 },   // 18
    { col: 10, row: 6 },  // 19
    { col: 11, row: 6 },  // 20
    { col: 12, row: 6 },  // 21 (Safe ⭐)
    { col: 13, row: 6 },  // 22
    { col: 14, row: 6 },  // 23
    { col: 14, row: 7 },  // 24 (Yellow End)
    { col: 14, row: 8 },  // 25
    { col: 13, row: 8 },  // 26: Yellow Start (Safe ⭐)
    { col: 12, row: 8 },  // 27
    { col: 11, row: 8 },  // 28
    { col: 10, row: 8 },  // 29
    { col: 9, row: 8 },   // 30
    { col: 8, row: 9 },   // 31
    { col: 8, row: 10 },  // 32
    { col: 8, row: 11 },  // 33
    { col: 8, row: 12 },  // 34 (Safe ⭐)
    { col: 8, row: 13 },  // 35
    { col: 8, row: 14 },  // 36
    { col: 7, row: 14 },  // 37 (Blue End)
    { col: 6, row: 14 },  // 38
    { col: 6, row: 13 },  // 39: Blue Start (Safe ⭐)
    { col: 6, row: 12 },  // 40
    { col: 6, row: 11 },  // 41
    { col: 6, row: 10 },  // 42
    { col: 6, row: 9 },   // 43
    { col: 5, row: 8 },   // 44
    { col: 4, row: 8 },   // 45
    { col: 3, row: 8 },   // 46
    { col: 2, row: 8 },   // 47 (Safe ⭐)
    { col: 1, row: 8 },   // 48
    { col: 0, row: 8 },   // 49
    { col: 0, row: 7 },   // 50 (Red End)
    { col: 0, row: 6 }    // 51
  ],

  // Home stretches (5 squares each)
  HOME_STRETCHES: {
    red: [
      { col: 1, row: 7 }, { col: 2, row: 7 }, { col: 3, row: 7 }, { col: 4, row: 7 }, { col: 5, row: 7 }
    ],
    green: [
      { col: 7, row: 1 }, { col: 7, row: 2 }, { col: 7, row: 3 }, { col: 7, row: 4 }, { col: 7, row: 5 }
    ],
    yellow: [
      { col: 13, row: 7 }, { col: 12, row: 7 }, { col: 11, row: 7 }, { col: 10, row: 7 }, { col: 9, row: 7 }
    ],
    blue: [
      { col: 7, row: 13 }, { col: 7, row: 12 }, { col: 7, row: 11 }, { col: 7, row: 10 }, { col: 7, row: 9 }
    ]
  },

  // Yard token slots
  YARD_SLOTS: {
    red: [
      { col: 1.5, row: 1.5 }, { col: 3.5, row: 1.5 },
      { col: 1.5, row: 3.5 }, { col: 3.5, row: 3.5 }
    ],
    green: [
      { col: 10.5, row: 1.5 }, { col: 12.5, row: 1.5 },
      { col: 10.5, row: 3.5 }, { col: 12.5, row: 3.5 }
    ],
    yellow: [
      { col: 10.5, row: 10.5 }, { col: 12.5, row: 10.5 },
      { col: 10.5, row: 12.5 }, { col: 12.5, row: 12.5 }
    ],
    blue: [
      { col: 1.5, row: 10.5 }, { col: 3.5, row: 10.5 },
      { col: 1.5, row: 12.5 }, { col: 3.5, row: 12.5 }
    ]
  },

  // Goal centers
  GOAL_CENTERS: {
    red: { col: 6.6, row: 7 },
    green: { col: 7, row: 6.6 },
    yellow: { col: 7.4, row: 7 },
    blue: { col: 7, row: 7.4 }
  },

  SAFE_SQUARES: [0, 8, 13, 21, 26, 34, 39, 47],

  COLOR_HEX: {
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#3b82f6'
  },

  COLOR_BG: {
    red: '#7f1d1d',
    green: '#064e3b',
    yellow: '#78350f',
    blue: '#1e3a8a'
  },

  getCellPixelCoords(col, row) {
    const cellSize = 40; // 600 / 15
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2
    };
  },

  renderBoardSVG() {
    const cellSize = 40;
    const totalSize = 600;

    let svg = `
      <svg id="ludoBoardSVG" viewBox="0 0 ${totalSize} ${totalSize}" class="ludo-board-svg" style="width: 100%; max-width: 540px; aspect-ratio: 1/1; display: block; margin: 0 auto; filter: drop-shadow(0 15px 35px rgba(0,0,0,0.6));">
        <defs>
          <filter id="ludoGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffffff" flood-opacity="0.9"/>
          </filter>
          <filter id="tokenShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Base Background -->
        <rect width="${totalSize}" height="${totalSize}" fill="#0b0f19" rx="16" />

        <!-- 1. YARDS (4 Corners) -->
        <!-- Red Yard: Top Left -->
        <rect x="0" y="0" width="${6 * cellSize}" height="${6 * cellSize}" fill="#ef4444" rx="12" />
        <rect x="${cellSize * 0.8}" y="${cellSize * 0.8}" width="${4.4 * cellSize}" height="${4.4 * cellSize}" fill="#0f172a" rx="8" />

        <!-- Green Yard: Top Right -->
        <rect x="${9 * cellSize}" y="0" width="${6 * cellSize}" height="${6 * cellSize}" fill="#10b981" rx="12" />
        <rect x="${9.8 * cellSize}" y="${cellSize * 0.8}" width="${4.4 * cellSize}" height="${4.4 * cellSize}" fill="#0f172a" rx="8" />

        <!-- Blue Yard: Bottom Left -->
        <rect x="0" y="${9 * cellSize}" width="${6 * cellSize}" height="${6 * cellSize}" fill="#3b82f6" rx="12" />
        <rect x="${cellSize * 0.8}" y="${9.8 * cellSize}" width="${4.4 * cellSize}" height="${4.4 * cellSize}" fill="#0f172a" rx="8" />

        <!-- Yellow Yard: Bottom Right -->
        <rect x="${9 * cellSize}" y="${9 * cellSize}" width="${6 * cellSize}" height="${6 * cellSize}" fill="#f59e0b" rx="12" />
        <rect x="${9.8 * cellSize}" y="${9.8 * cellSize}" width="${4.4 * cellSize}" height="${4.4 * cellSize}" fill="#0f172a" rx="8" />

        <!-- 2. YARD TOKEN BASES (White Circles) -->
    `;

    // Draw 4 circles for each yard
    ['red', 'green', 'yellow', 'blue'].forEach(color => {
      this.YARD_SLOTS[color].forEach((slot, idx) => {
        const p = this.getCellPixelCoords(slot.col, slot.row);
        svg += `
          <circle cx="${p.x}" cy="${p.y}" r="22" fill="#1e293b" stroke="${this.COLOR_HEX[color]}" stroke-width="2.5" />
          <circle cx="${p.x}" cy="${p.y}" r="14" fill="${this.COLOR_HEX[color]}" opacity="0.3" />
        `;
      });
    });

    // 3. TRACK SQUARES (52 outer squares)
    this.TRACK_COORDS.forEach((sq, idx) => {
      const x = sq.col * cellSize;
      const y = sq.row * cellSize;
      let fill = '#111827';
      let stroke = '#1e293b';

      // Start squares colored
      if (idx === 0) fill = '#ef4444'; // Red start
      else if (idx === 13) fill = '#10b981'; // Green start
      else if (idx === 26) fill = '#f59e0b'; // Yellow start
      else if (idx === 39) fill = '#3b82f6'; // Blue start

      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="${stroke}" stroke-width="1" />`;

      // Draw safe star on safe squares
      if (this.SAFE_SQUARES.includes(idx)) {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2 + 1;
        svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="16" fill="#facc15">⭐</text>`;
      }
    });

    // 4. HOME STRETCH TRACKS
    ['red', 'green', 'yellow', 'blue'].forEach(color => {
      this.HOME_STRETCHES[color].forEach((sq, i) => {
        const x = sq.col * cellSize;
        const y = sq.row * cellSize;
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${this.COLOR_HEX[color]}" stroke="#0f172a" stroke-width="1" opacity="0.85" />`;
        // Inner arrow
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#ffffff" opacity="0.6" />`;
      });
    });

    // 5. CENTER GOAL TRIANGLES (Home Victory)
    const midX = 7.5 * cellSize;
    const midY = 7.5 * cellSize;
    const x6 = 6 * cellSize;
    const y6 = 6 * cellSize;
    const x9 = 9 * cellSize;
    const y9 = 9 * cellSize;

    // Red center triangle (Left)
    svg += `<polygon points="${x6},${y6} ${midX},${midY} ${x6},${y9}" fill="#ef4444" />`;
    // Green center triangle (Top)
    svg += `<polygon points="${x6},${y6} ${midX},${midY} ${x9},${y6}" fill="#10b981" />`;
    // Yellow center triangle (Right)
    svg += `<polygon points="${x9},${y6} ${midX},${midY} ${x9},${y9}" fill="#f59e0b" />`;
    // Blue center triangle (Bottom)
    svg += `<polygon points="${x6},${y9} ${midX},${midY} ${x9},${y9}" fill="#3b82f6" />`;

    // Center Gold Crown / Trophy
    svg += `
      <circle cx="${midX}" cy="${midY}" r="18" fill="#0f172a" stroke="#facc15" stroke-width="2" />
      <text x="${midX}" y="${midY + 1}" text-anchor="middle" dominant-baseline="central" font-size="14">👑</text>
    `;

    // Layer for dynamically updated tokens
    svg += `<g id="ludoTokensLayer"></g>`;
    svg += `</svg>`;

    return svg;
  },

  // Calculate coordinates for a token
  getTokenPixelCoords(color, pos, tokenIndex) {
    if (pos === -1) {
      // In Yard
      const slot = this.YARD_SLOTS[color][tokenIndex] || { col: 1.5, row: 1.5 };
      return this.getCellPixelCoords(slot.col, slot.row);
    }

    if (pos === 999) {
      // In Center Goal
      const goal = this.GOAL_CENTERS[color] || { col: 7.5, row: 7.5 };
      return this.getCellPixelCoords(goal.col, goal.row);
    }

    // Home base stretch
    const homeBase = (color === 'red' ? 100 : (color === 'green' ? 110 : (color === 'yellow' ? 120 : 130)));
    if (pos >= homeBase) {
      const step = pos - homeBase;
      const sq = this.HOME_STRETCHES[color][step] || this.HOME_STRETCHES[color][0];
      return this.getCellPixelCoords(sq.col, sq.row);
    }

    // Main Track (0 to 51)
    const trackSq = this.TRACK_COORDS[pos % 52] || this.TRACK_COORDS[0];
    return this.getCellPixelCoords(trackSq.col, trackSq.row);
  },

  // Update tokens on SVG board
  updateTokens(ludoState, myPlayerId) {
    const layer = document.getElementById('ludoTokensLayer');
    if (!layer || !ludoState || !ludoState.players) return;

    const activePlayer = ludoState.players[ludoState.turnIndex];
    const isMyTurn = activePlayer && activePlayer.id === myPlayerId;
    const eligibleTokens = (isMyTurn && ludoState.diceRolled) ? (ludoState.eligibleTokens || []) : [];

    let tokensSVG = '';

    ludoState.players.forEach(player => {
      const isPlayerTurn = activePlayer && activePlayer.id === player.id;
      const colorHex = this.COLOR_HEX[player.color] || '#ffffff';

      player.tokens.forEach((pos, tIdx) => {
        const coords = this.getTokenPixelCoords(player.color, pos, tIdx);
        const isEligible = isPlayerTurn && isMyTurn && eligibleTokens.includes(tIdx);

        tokensSVG += `
          <g id="ludo_token_${player.color}_${tIdx}" class="ludo-token-elem ${isEligible ? 'token-can-move' : ''}" 
             transform="translate(${coords.x}, ${coords.y})" 
             style="cursor: ${isEligible ? 'pointer' : 'default'};"
             onclick="LudoClient.onTokenClick('${player.color}', ${tIdx})">
            
            <!-- Highlighting pulsating ring if eligible -->
            ${isEligible ? `
              <circle cx="0" cy="0" r="21" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="4,4" class="ludo-pulse-ring" />
              <circle cx="0" cy="0" r="17" fill="rgba(255,255,255,0.3)" />
            ` : ''}

            <!-- Token Body -->
            <circle cx="0" cy="0" r="14" fill="${colorHex}" stroke="#ffffff" stroke-width="2.5" filter="url(#tokenShadow)" />
            
            <!-- Token Center Pin -->
            <circle cx="0" cy="0" r="6" fill="#ffffff" opacity="0.9" />
            <circle cx="0" cy="0" r="2" fill="${colorHex}" />

            <!-- Token number label -->
            <text x="0" y="18" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff" stroke="#000000" stroke-width="0.5">T${tIdx + 1}</text>
          </g>
        `;
      });
    });

    layer.innerHTML = tokensSVG;
    this.updateControlsUI(ludoState, myPlayerId);
  },

  updateControlsUI(ludoState, myPlayerId) {
    const activePlayer = ludoState.players[ludoState.turnIndex];
    if (!activePlayer) return;

    const isMyTurn = activePlayer.id === myPlayerId;
    const rollBtn = document.getElementById('ludoRollBtn');
    const turnNameEl = document.getElementById('ludoTurnName');
    const turnColorPill = document.getElementById('ludoTurnColorPill');
    const diceResultEl = document.getElementById('ludoDiceResult');
    const instructionEl = document.getElementById('ludoInstructionText');

    if (turnNameEl) turnNameEl.textContent = activePlayer.name;
    if (turnColorPill) {
      turnColorPill.textContent = activePlayer.color.toUpperCase();
      turnColorPill.style.background = this.COLOR_HEX[activePlayer.color];
      turnColorPill.style.color = '#ffffff';
    }

    if (diceResultEl) {
      if (ludoState.diceValue) {
        diceResultEl.textContent = ludoState.diceValue;
      } else {
        diceResultEl.textContent = '-';
      }
    }

    if (rollBtn) {
      if (isMyTurn && !ludoState.diceRolled) {
        rollBtn.disabled = false;
        rollBtn.classList.remove('btn-disabled');
        rollBtn.textContent = 'ROLL DICE 🎲';
        if (instructionEl) instructionEl.textContent = 'Your turn! Roll the dice.';
      } else if (isMyTurn && ludoState.diceRolled) {
        rollBtn.disabled = true;
        rollBtn.classList.add('btn-disabled');
        rollBtn.textContent = `ROLLED ${ludoState.diceValue}!`;
        if (ludoState.eligibleTokens && ludoState.eligibleTokens.length > 0) {
          if (instructionEl) instructionEl.textContent = `Tap one of the glowing tokens on the board to move!`;
        } else {
          if (instructionEl) instructionEl.textContent = `No moves possible with ${ludoState.diceValue}. Passing turn...`;
        }
      } else {
        rollBtn.disabled = true;
        rollBtn.classList.add('btn-disabled');
        rollBtn.textContent = `WAITING FOR ${activePlayer.name.toUpperCase()}...`;
        if (instructionEl) instructionEl.textContent = `Waiting for ${activePlayer.name} to play...`;
      }
    }

    // Render Players Status Bar
    const statusContainer = document.getElementById('ludoPlayersStatus');
    if (statusContainer) {
      let cards = '';
      ludoState.players.forEach(p => {
        const isCurrent = p.id === activePlayer.id;
        const color = this.COLOR_HEX[p.color];
        const yardCount = p.tokens.filter(pos => pos === -1).length;
        const goalCount = p.tokens.filter(pos => pos === 999).length;
        const trackCount = 4 - yardCount - goalCount;

        cards += `
          <div class="ludo-player-card ${isCurrent ? 'active-turn' : ''}" style="border-left: 4px solid ${color};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <b style="color: ${color}; font-size: 0.9rem;">${p.name}</b>
              <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${p.color.toUpperCase()}</span>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px; display: flex; gap: 8px;">
              <span>🏠 Yard: ${yardCount}</span>
              <span>🏃 Track: ${trackCount}</span>
              <span>🏆 Goal: ${goalCount}/2</span>
            </div>
          </div>
        `;
      });
      statusContainer.innerHTML = cards;
    }
  },

  onTokenClick(color, tokenIndex) {
    if (window.onLudoTokenSelected) {
      window.onLudoTokenSelected(tokenIndex);
    }
  }
};

window.LudoClient = LudoClient;
