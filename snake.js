// SNAKE & LADDERS CLIENT BOARD & GAME RENDERER
// Premium 10x10 Vector Engine with Giant 99 Titan Snake, Step-by-Step Smooth Token Movement & Clear Name Tags

const SnakeGame = {
  // Board configuration
  ladders: {
    4: 14,
    9: 31,
    20: 38,
    28: 84,
    40: 59,
    51: 67,
    63: 81,
    71: 91
  },

  snakes: {
    17: 7,
    54: 34,
    62: 19,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    99: 10 // THE GIANT 99 TITAN COBRA!
  },

  // Calculate center coordinates (x, y) in a 1000x1000 viewBox for square n (1 to 100)
  getSquareCoords(n) {
    if (n < 1) return { x: 50, y: 1050 }; // in dugout
    if (n > 100) n = 100;
    const index = n - 1;
    const row = Math.floor(index / 10); // 0 at bottom, 9 at top
    const colInRow = index % 10;
    const col = (row % 2 === 0) ? colInRow : (9 - colInRow);
    const x = col * 100 + 50;
    const y = (9 - row) * 100 + 50;
    return { x, y, row, col };
  },

  // Render the entire SVG board (squares, numbers, ladders, snakes, and Titan 99)
  renderBoardSVG() {
    let svg = `
      <svg id="snakeBoardSVG" viewBox="0 0 1000 1000" class="snake-board-svg">
        <defs>
          <!-- Gradient for board tiles -->
          <linearGradient id="tileDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#111827" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="tileAlt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#131e33" />
          </linearGradient>
          <linearGradient id="tile100" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#78350f" />
            <stop offset="50%" stop-color="#b45309" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
          <linearGradient id="tile99" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#450a0a" />
            <stop offset="100%" stop-color="#881337" />
          </linearGradient>

          <!-- Ladder Gold Gradient -->
          <linearGradient id="ladderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="50%" stop-color="#818cf8" />
            <stop offset="100%" stop-color="#00f0ff" />
          </linearGradient>

          <!-- Snake Gradients -->
          <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444" />
            <stop offset="50%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#7f1d1d" />
          </linearGradient>

          <!-- TITAN 99 Snake Gradient -->
          <linearGradient id="titanSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff0055" />
            <stop offset="25%" stop-color="#7928ca" />
            <stop offset="60%" stop-color="#4c1d95" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>

          <!-- Filters -->
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.8"/>
          </filter>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00f0ff" flood-opacity="0.7"/>
          </filter>
          <filter id="glowTitan" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ff0055" flood-opacity="0.9"/>
          </filter>
        </defs>

        <!-- Board Background & Grid Tiles -->
        <g id="boardTiles">
    `;

    // 100 Squares
    for (let n = 1; n <= 100; n++) {
      const coords = this.getSquareCoords(n);
      const isAlt = (coords.row + coords.col) % 2 === 1;
      let fill = isAlt ? 'url(#tileAlt)' : 'url(#tileDark)';
      let border = 'rgba(255, 255, 255, 0.08)';
      let extraClass = '';

      if (n === 100) {
        fill = 'url(#tile100)';
        border = '#f59e0b';
        extraClass = 'tile-winner';
      } else if (n === 99) {
        fill = 'url(#tile99)';
        border = '#ef4444';
        extraClass = 'tile-titan-hazard';
      } else if (n === 1) {
        border = '#10b981';
      }

      svg += `
        <rect id="sq_tile_${n}" x="${coords.col * 100}" y="${(9 - coords.row) * 100}" width="100" height="100" fill="${fill}" stroke="${border}" stroke-width="1.5" rx="4" class="${extraClass}" />
        <text x="${coords.col * 100 + 12}" y="${(9 - coords.row) * 100 + 24}" fill="rgba(255,255,255,0.75)" font-size="14" font-weight="800" font-family="'Outfit', sans-serif">${n}</text>
      `;

      if (n === 100) {
        svg += `
          <text x="${coords.x}" y="${coords.y + 12}" text-anchor="middle" font-size="34">👑</text>
          <text x="${coords.x}" y="${coords.y + 36}" text-anchor="middle" fill="#fef08a" font-size="11" font-weight="900" letter-spacing="1">FINISH</text>
        `;
      } else if (n === 99) {
        svg += `
          <text x="${coords.x + 10}" y="${coords.y - 10}" text-anchor="middle" font-size="16">⚠️</text>
          <text x="${coords.x}" y="${coords.y + 36}" text-anchor="middle" fill="#fca5a5" font-size="10" font-weight="900" letter-spacing="1">TITAN</text>
        `;
      } else if (n === 1) {
        svg += `
          <text x="${coords.x}" y="${coords.y + 34}" text-anchor="middle" fill="#34d399" font-size="11" font-weight="900" letter-spacing="1">START</text>
        `;
      }
    }

    svg += `</g>`;

    // 2. Render Ladders
    svg += `<g id="boardLadders">`;
    for (const [startStr, end] of Object.entries(this.ladders)) {
      const start = parseInt(startStr);
      svg += this.renderLadderSVG(start, end);
    }
    svg += `</g>`;

    // 3. Render Snakes
    svg += `<g id="boardSnakes">`;
    for (const [headStr, tail] of Object.entries(this.snakes)) {
      const head = parseInt(headStr);
      if (head !== 99) {
        svg += this.renderSnakeSVG(head, tail);
      }
    }
    svg += this.renderGiantTitan99Snake();
    svg += `</g>`;

    // 4. Tokens Overlay Container
    svg += `<g id="boardTokensLayer"></g>`;

    svg += `</svg>`;
    return svg;
  },

  renderLadderSVG(start, end) {
    const c1 = this.getSquareCoords(start);
    const c2 = this.getSquareCoords(end);

    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const railOffset = 14;
    const perpX = Math.sin(angle) * railOffset;
    const perpY = -Math.cos(angle) * railOffset;

    const r1x1 = c1.x + perpX, r1y1 = c1.y + perpY;
    const r1x2 = c2.x + perpX, r1y2 = c2.y + perpY;
    const r2x1 = c1.x - perpX, r2y1 = c1.y - perpY;
    const r2x2 = c2.x - perpX, r2y2 = c2.y - perpY;

    let rungs = '';
    const numRungs = Math.max(3, Math.floor(length / 32));
    for (let i = 1; i < numRungs; i++) {
      const t = i / numRungs;
      const rx1 = r1x1 + (r1x2 - r1x1) * t;
      const ry1 = r1y1 + (r1y2 - r1y1) * t;
      const rx2 = r2x1 + (r2x2 - r2x1) * t;
      const ry2 = r2y1 + (r2y2 - r2y1) * t;
      rungs += `<line x1="${rx1}" y1="${ry1}" x2="${rx2}" y2="${ry2}" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" opacity="0.85"/>`;
    }

    return `
      <g class="ladder-group" filter="url(#glowCyan)">
        <line x1="${r1x1}" y1="${r1y1}" x2="${r1x2}" y2="${r1y2}" stroke="url(#ladderGrad)" stroke-width="5" stroke-linecap="round"/>
        <line x1="${r2x1}" y1="${r2y1}" x2="${r2x2}" y2="${r2y2}" stroke="url(#ladderGrad)" stroke-width="5" stroke-linecap="round"/>
        ${rungs}
      </g>
    `;
  },

  renderSnakeSVG(head, tail) {
    const c1 = this.getSquareCoords(head);
    const c2 = this.getSquareCoords(tail);

    const midX = (c1.x + c2.x) / 2 + (head % 2 === 0 ? 45 : -45);
    const midY = (c1.y + c2.y) / 2;

    const pathData = `M ${c1.x} ${c1.y} Q ${midX} ${midY} ${c2.x} ${c2.y}`;

    return `
      <g class="snake-group">
        <path d="${pathData}" fill="none" stroke="#000000" stroke-width="14" stroke-linecap="round" opacity="0.4"/>
        <path d="${pathData}" fill="none" stroke="url(#snakeGrad)" stroke-width="10" stroke-linecap="round"/>
        <path d="${pathData}" fill="none" stroke="#fca5a5" stroke-width="3" stroke-dasharray="6,8" stroke-linecap="round"/>
        <circle cx="${c1.x}" cy="${c1.y}" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
        <circle cx="${c1.x - 4}" cy="${c1.y - 3}" r="2" fill="#fef08a"/>
        <circle cx="${c1.x + 4}" cy="${c1.y - 3}" r="2" fill="#fef08a"/>
        <circle cx="${c2.x}" cy="${c2.y}" r="4" fill="#7f1d1d"/>
      </g>
    `;
  },

  renderGiantTitan99Snake() {
    const c99 = this.getSquareCoords(99);
    const c10 = this.getSquareCoords(10);

    const pathData = `M ${c99.x} ${c99.y} 
      C 120 280, 380 420, 300 500
      C 220 580, 240 650, 450 720
      C 650 800, 820 860, ${c10.x} ${c10.y}`;

    return `
      <g id="giantTitanSnake" class="titan-snake-group" filter="url(#glowTitan)">
        <path d="${pathData}" fill="none" stroke="#000000" stroke-width="28" stroke-linecap="round" opacity="0.6"/>
        <path d="${pathData}" fill="none" stroke="url(#titanSnakeGrad)" stroke-width="20" stroke-linecap="round"/>
        <path d="${pathData}" fill="none" stroke="#ff0055" stroke-width="6" stroke-dasharray="10,12" stroke-linecap="round" opacity="0.9"/>
        <path d="${pathData}" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,16" stroke-linecap="round"/>

        <!-- TITAN COBRA HEAD AT 99 -->
        <g transform="translate(${c99.x}, ${c99.y})">
          <ellipse cx="0" cy="0" rx="34" ry="24" fill="#ff0055" stroke="#ffffff" stroke-width="3" />
          <path d="M -30 0 C -25 18, 25 18, 30 0 Z" fill="#7928ca"/>
          <polygon points="-8,-20 0,-32 8,-20" fill="#ff0055" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="-12" cy="-4" r="5" fill="#facc15" stroke="#000000" stroke-width="1"/>
          <line x1="-12" y1="-8" x2="-12" y2="0" stroke="#000000" stroke-width="2"/>
          <circle cx="12" cy="-4" r="5" fill="#facc15" stroke="#000000" stroke-width="1"/>
          <line x1="12" y1="-8" x2="12" y2="0" stroke="#000000" stroke-width="2"/>
          <polygon points="-8,6 -5,14 -2,6" fill="#ffffff"/>
          <polygon points="2,6 5,14 8,6" fill="#ffffff"/>
          <path d="M 0 10 L 0 24 L -4 30 M 0 24 L 4 30" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="-38" y="-42" width="76" height="16" rx="8" fill="#111827" stroke="#ff0055" stroke-width="1.5"/>
          <text x="0" y="-30" fill="#fecdd3" font-size="9" font-weight="900" text-anchor="middle" letter-spacing="1">TITAN 99</text>
        </g>

        <!-- Tail at Square 10 -->
        <g transform="translate(${c10.x}, ${c10.y})">
          <circle cx="0" cy="0" r="8" fill="#ff0055" stroke="#ffffff" stroke-width="2"/>
        </g>
      </g>
    `;
  },

  // Update token positions on the board with CLEAR NAME PILLS
  updateTokens(players, activePlayerId) {
    const layer = document.getElementById('boardTokensLayer');
    if (!layer) return;

    let svgTokens = '';
    const posGroups = {};
    const lockedPlayers = [];

    players.forEach(p => {
      if (p.isLocked || p.position === 0) {
        lockedPlayers.push(p);
      } else {
        if (!posGroups[p.position]) posGroups[p.position] = [];
        posGroups[p.position].push(p);
      }
    });

    // Render tokens with prominent player names & position indicators
    for (const [posStr, playerList] of Object.entries(posGroups)) {
      const pos = parseInt(posStr);
      const center = this.getSquareCoords(pos);
      const count = playerList.length;

      playerList.forEach((p, idx) => {
        let offsetX = 0;
        let offsetY = 0;

        if (count > 1) {
          const angle = (idx / count) * 2 * Math.PI;
          const radius = Math.min(26, 12 + count * 2);
          offsetX = Math.cos(angle) * radius;
          offsetY = Math.sin(angle) * radius;
        }

        const tx = center.x + offsetX;
        const ty = center.y + offsetY;
        const isCurrentTurn = p.id === activePlayerId;
        const color = (p.color && p.color.hex) ? p.color.hex : '#00f0ff';
        const displayName = (p.name || 'P').substring(0, 9);

        svgTokens += `
          <g id="token_player_${p.id}" class="board-token ${isCurrentTurn ? 'token-active-turn' : ''}" transform="translate(${tx}, ${ty})" data-player-id="${p.id}">
            <!-- Glow ring if active turn -->
            ${isCurrentTurn ? `<circle cx="0" cy="0" r="24" fill="none" stroke="${color}" stroke-width="3.5" stroke-dasharray="5,5" class="token-turn-ring" />` : ''}
            
            <!-- Token Drop Shadow -->
            <circle cx="0" cy="3" r="16" fill="#000000" opacity="0.6"/>
            
            <!-- Token Circle Body -->
            <circle cx="0" cy="0" r="15" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
            
            <!-- Player Avatar Inside Token -->
            <text x="0" y="5" text-anchor="middle" font-size="12" font-weight="900" fill="#07090e">${p.avatar || '🐯'}</text>
            
            <!-- CLEAR PROMINENT NAME PILL (Shows Player Name & Current Square) -->
            <rect x="-35" y="16" width="70" height="18" rx="6" fill="#07090e" stroke="${color}" stroke-width="1.5" opacity="0.95"/>
            <text x="0" y="29" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffffff" letter-spacing="0.3">${displayName}</text>
          </g>
        `;
      });
    }

    layer.innerHTML = svgTokens;
    this.updateLockedDugout(lockedPlayers, activePlayerId);
  },

  // SLOW, SMOOTH STEP-BY-STEP TOKEN MOVEMENT
  animateTokenMovement(playerId, stepPath, finalPos, eventType, onComplete) {
    const tokenEl = document.getElementById(`token_player_${playerId}`);
    if (!tokenEl || !stepPath || stepPath.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    let stepIdx = 0;
    const stepInterval = 200; // 200ms per square for clear, smooth hopping!

    function hopNext() {
      if (stepIdx < stepPath.length) {
        const sq = stepPath[stepIdx];
        const coords = SnakeGame.getSquareCoords(sq);
        tokenEl.setAttribute('transform', `translate(${coords.x}, ${coords.y})`);
        
        // Play hop sound
        SoundEngine.playTokenHop();

        // Highlight square temporarily
        const tile = document.getElementById(`sq_tile_${sq}`);
        if (tile) {
          tile.setAttribute('stroke', '#00f0ff');
          tile.setAttribute('stroke-width', '3');
          setTimeout(() => {
            tile.setAttribute('stroke', 'rgba(255,255,255,0.08)');
            tile.setAttribute('stroke-width', '1.5');
          }, 180);
        }

        stepIdx++;
        setTimeout(hopNext, stepInterval);
      } else {
        // Step path finished! Check if there's a ladder or snake to glide along!
        if (eventType === 'ladder' || eventType === 'snake' || eventType === 'giant_99') {
          setTimeout(() => {
            const finalCoords = SnakeGame.getSquareCoords(finalPos);
            // Add smooth gliding transition
            tokenEl.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            tokenEl.setAttribute('transform', `translate(${finalCoords.x}, ${finalCoords.y})`);

            setTimeout(() => {
              tokenEl.style.transition = '';
              if (onComplete) onComplete();
            }, 650);
          }, 300);
        } else {
          if (onComplete) onComplete();
        }
      }
    }

    hopNext();
  },

  // Render Dugout with clear names and status
  updateLockedDugout(lockedPlayers, activePlayerId) {
    const dugoutList = document.getElementById('snakeLockedList');
    const dugoutCount = document.getElementById('snakeLockedCount');
    if (!dugoutList) return;

    if (dugoutCount) dugoutCount.textContent = `${lockedPlayers.length} LOCKED`;

    if (lockedPlayers.length === 0) {
      dugoutList.innerHTML = `<div style="color: #34d399; font-size: 0.82rem; text-align: center; padding: 10px;">All players entered the board! 🏁</div>`;
      return;
    }

    let html = '';
    lockedPlayers.forEach(p => {
      const isCurrentTurn = p.id === activePlayerId;
      const color = (p.color && p.color.hex) ? p.color.hex : '#00f0ff';

      html += `
        <div class="dugout-player-card ${isCurrentTurn ? 'dugout-active-turn' : ''}">
          <div class="dugout-avatar" style="border-color: ${color}; background: ${p.color ? p.color.bg : 'rgba(0,240,255,0.2)'};">
            <span>${p.avatar || '🐯'}</span>
            <span class="dugout-lock-badge">🔒</span>
          </div>
          <div class="dugout-info">
            <div class="dugout-name" style="font-size: 0.95rem; font-weight: 800;">
              ${p.name} ${isCurrentTurn ? '<span class="badge-turn" style="background:#f59e0b; color:#07090e;">ROLL A 1!</span>' : ''}
            </div>
            <div class="dugout-sub" style="font-weight: 700; color: #f87171;">LOCKED 🔒 (Roll 1 to enter)</div>
          </div>
        </div>
      `;
    });

    dugoutList.innerHTML = html;
  },

  // 3D Animated Dice Component
  rollDiceAnimation(targetNumber, callback) {
    const diceCube = document.getElementById('snake3DDice');
    if (!diceCube) {
      if (callback) callback();
      return;
    }

    SoundEngine.playDiceRoll();
    diceCube.classList.add('rolling');

    const rotations = {
      1: { x: 0, y: 0 },
      2: { x: 0, y: 180 },
      3: { x: 0, y: -90 },
      4: { x: 0, y: 90 },
      5: { x: -90, y: 0 },
      6: { x: 90, y: 0 }
    };

    const rot = rotations[targetNumber] || { x: 0, y: 0 };
    const spinX = rot.x + 720 + Math.floor(Math.random() * 2) * 360;
    const spinY = rot.y + 720 + Math.floor(Math.random() * 2) * 360;

    diceCube.style.transform = `rotateX(${spinX}deg) rotateY(${spinY}deg)`;

    setTimeout(() => {
      diceCube.classList.remove('rolling');
      diceCube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
      if (callback) callback();
    }, 650);
  }
};
