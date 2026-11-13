// Vector hand rendering engine for Naqqash Hand Cricket
// Supports values: 1, 2, 3, 4, 5, 6 (Thumbs Up 👍), 10 (Punch / Fist 👊), and hidden (ready fist)

const HandRenderer = {
  getMoveLabel(value) {
    const v = parseInt(value);
    switch (v) {
      case 1: return '☝️ 1 Finger (1 Run)';
      case 2: return '✌️ 2 Fingers (2 Runs)';
      case 3: return '🤟 3 Fingers (3 Runs)';
      case 4: return '🖖 4 Fingers (4 Runs)';
      case 5: return '🖐️ 5 Fingers (5 Runs)';
      case 6: return '👍 6 SIX! (Thumbs Up)';
      case 10: return '👊 10 PUNCH!';
      default: return '...';
    }
  },

  getHandSVG(value, role = 'batsman', isRevealed = true) {
    const isBatsman = role === 'batsman';
    const mainColor = isBatsman ? '#38bdf8' : '#f87171';
    const skinTone = '#ffdfba';
    const skinShadow = '#e6ad73';
    const skinOutline = '#6b2d0b';
    const nailColor = '#fff1e6';
    const bandColor = isBatsman ? '#0284c7' : '#dc2626';
    const bandText = isBatsman ? 'BAT' : 'BOWL';
    const uid = `${role}_${isRevealed ? value : 'h'}`;
    const mirrorTransform = isBatsman ? 'scale(1,1)' : 'scale(-1,1) translate(-200,0)';

    if (!isRevealed) {
      return `
        <svg viewBox="0 0 200 240" class="hand-svg hand-ready ${isBatsman ? 'hand-left' : 'hand-right'}">
          <defs>
            <linearGradient id="skinGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${skinTone}" />
              <stop offset="100%" stop-color="${skinShadow}" />
            </linearGradient>
            <filter id="glow_${uid}">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${mainColor}" flood-opacity="0.6"/>
            </filter>
          </defs>
          <g filter="url(#glow_${uid})" transform="${mirrorTransform}">
            <rect x="70" y="160" width="60" height="65" rx="10" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
            <rect x="66" y="170" width="68" height="32" rx="6" fill="${bandColor}" stroke="#ffffff" stroke-width="2"/>
            <!-- Closed fist ready for shake -->
            <path d="M 58 160 C 52 118 58 96 80 88 C 96 82 112 82 128 88 C 148 98 150 120 142 160 Z"
                  fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
            <path d="M 73 114 C 90 120 115 120 132 114" stroke="${skinOutline}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 71 129 C 90 135 115 135 134 129" stroke="${skinOutline}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 70 144 C 90 150 115 150 135 144" stroke="${skinOutline}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 58 134 C 54 108 75 104 86 118" stroke="${skinOutline}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <circle cx="85" cy="68" r="4" fill="${mainColor}" class="pulse-dot"/>
            <circle cx="100" cy="62" r="5" fill="${mainColor}" class="pulse-dot" style="animation-delay: 0.15s"/>
            <circle cx="115" cy="68" r="4" fill="${mainColor}" class="pulse-dot" style="animation-delay: 0.3s"/>
          </g>
          <text x="100" y="191" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="1">${bandText}</text>
        </svg>
      `;
    }

    const v = parseInt(value);
    let gestureContent = '';

    // Helper for clean anatomical open finger pill with tip highlight
    const finger = (d, nailX, nailY, nailRx = 5, nailRy = 7, rot = 0) => `
      <path d="${d}" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
      <ellipse cx="${nailX}" cy="${nailY}" rx="${nailRx}" ry="${nailRy}" transform="rotate(${rot} ${nailX} ${nailY})" fill="${nailColor}" stroke="${skinOutline}" stroke-width="1.5" opacity="0.9"/>
    `;

    switch (v) {
      case 1:
        // 1: Index finger straight up, 3 other fingers cleanly curled as ovals, thumb tucked across
        gestureContent = `
          <!-- Palm base -->
          <path d="M 62 122 C 58 158 76 168 100 168 C 124 168 142 158 138 122 C 136 108 118 105 100 106 C 82 106 64 108 62 122 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <!-- 1 Open Index Finger -->
          ${finger('M 74 122 L 72 34 C 72 20 92 20 92 34 L 94 122 Z', 82, 34, 6, 8, -1)}
          <path d="M 75 68 Q 83 71 92 68" stroke="${skinOutline}" stroke-width="2" fill="none"/>
          <path d="M 75 96 Q 83 99 92 96" stroke="${skinOutline}" stroke-width="2" fill="none"/>
          <!-- 3 Clearly Curled/Closed Fingers -->
          <rect x="94" y="106" width="16" height="28" rx="8" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <rect x="110" y="108" width="15" height="26" rx="7.5" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <rect x="125" y="112" width="14" height="23" rx="7" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <!-- Thumb folded over palm & curled middle -->
          <path d="M 60 144 C 62 124 92 120 112 132 C 118 136 115 148 104 146 C 90 144 74 146 65 152 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5" stroke-linejoin="round"/>
        `;
        break;

      case 2:
        // 2: Clear V-sign (Index + Middle open wide), Ring + Pinky curled, thumb across
        gestureContent = `
          <!-- Palm base -->
          <path d="M 62 124 C 58 158 76 168 100 168 C 124 168 142 158 138 124 C 136 110 116 106 100 106 C 84 106 64 110 62 124 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <!-- Finger 1 (Index tilted left) -->
          ${finger('M 73 122 L 54 42 C 50 28 69 24 73 38 L 91 118 Z', 63, 39, 5.5, 8, -14)}
          <!-- Finger 2 (Middle tilted right) -->
          ${finger('M 93 118 L 106 34 C 109 20 128 23 125 37 L 111 122 Z', 116, 36, 5.5, 8, 10)}
          <!-- 2 Clearly Curled Fingers (Ring & Pinky) -->
          <rect x="110" y="112" width="15" height="26" rx="7.5" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <rect x="124" y="116" width="14" height="23" rx="7" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <!-- Thumb tucked across -->
          <path d="M 60 145 C 64 124 98 122 118 134 C 124 138 120 148 108 147 C 92 145 76 147 66 153 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5" stroke-linejoin="round"/>
        `;
        break;

      case 3:
        // 3: Index + Middle + Ring clearly open & separated, Pinky curled with Thumb holding it
        gestureContent = `
          <!-- Palm base -->
          <path d="M 62 126 C 58 158 76 168 100 168 C 124 168 142 158 138 126 C 136 112 116 108 100 108 C 84 108 64 112 62 126 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <!-- Finger 1 (Index) -->
          ${finger('M 68 124 L 50 48 C 46 35 64 31 68 44 L 83 119 Z', 58, 45, 5, 7.5, -14)}
          <!-- Finger 2 (Middle) -->
          ${finger('M 86 118 L 89 34 C 90 20 108 20 108 34 L 104 118 Z', 99, 34, 5.5, 8, 1)}
          <!-- Finger 3 (Ring) -->
          ${finger('M 106 120 L 122 46 C 125 33 142 38 138 51 L 122 124 Z', 130, 48, 5, 7.5, 14)}
          <!-- Curled Pinky -->
          <rect x="123" y="118" width="15" height="24" rx="7.5" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <!-- Thumb folded across palm holding pinky -->
          <path d="M 60 146 C 68 126 104 124 124 136 C 129 140 125 150 113 148 C 96 146 78 148 66 154 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5" stroke-linejoin="round"/>
        `;
        break;

      case 4:
        // 4: All 4 fingers clearly open & separated, thumb folded tightly inside lower palm
        gestureContent = `
          <!-- Palm base -->
          <path d="M 60 128 C 58 160 76 168 100 168 C 124 168 142 160 140 128 C 138 114 118 110 100 110 C 82 110 62 114 60 128 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <!-- Finger 1 (Index) -->
          ${finger('M 64 126 L 46 54 C 43 42 59 38 63 50 L 79 120 Z', 54, 52, 4.5, 7, -14)}
          <!-- Finger 2 (Middle) -->
          ${finger('M 81 120 L 79 38 C 79 25 96 25 97 38 L 97 120 Z', 88, 38, 5, 7.5, -1)}
          <!-- Finger 3 (Ring) -->
          ${finger('M 99 120 L 107 40 C 109 27 125 29 123 42 L 114 122 Z', 115, 41, 5, 7.5, 7)}
          <!-- Finger 4 (Pinky) -->
          ${finger('M 116 124 L 134 58 C 138 46 153 51 149 63 L 132 128 Z', 142, 60, 4.5, 7, 17)}
          <!-- Thumb folded neatly INSIDE palm so clearly 4 fingers (not 5!) -->
          <path d="M 60 148 C 68 128 96 130 112 142 C 117 146 113 156 102 154 C 88 151 74 152 64 157 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5" stroke-linejoin="round"/>
        `;
        break;

      case 5:
        // 5: Wide Open Hand - Thumb sticking far out + 4 spread fingers!
        gestureContent = `
          <!-- Palm Center -->
          <path d="M 62 130 C 60 160 78 168 100 168 C 122 168 140 160 138 130 C 136 116 118 112 100 112 C 82 112 64 116 62 130 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <!-- Finger 1: Thumb wide open left -->
          ${finger('M 64 148 L 28 114 C 19 104 31 90 42 100 L 72 128 Z', 35, 106, 5, 7, -45)}
          <!-- Finger 2: Index -->
          ${finger('M 70 124 L 54 50 C 51 38 67 34 71 46 L 84 118 Z', 62, 48, 4.5, 7, -13)}
          <!-- Finger 3: Middle -->
          ${finger('M 86 118 L 87 34 C 88 21 104 21 105 34 L 103 118 Z', 96, 34, 5, 7.5, 0)}
          <!-- Finger 4: Ring -->
          ${finger('M 105 119 L 118 42 C 121 29 136 33 134 45 L 120 122 Z', 126, 44, 4.5, 7, 10)}
          <!-- Finger 5: Pinky -->
          ${finger('M 122 125 L 146 66 C 151 54 166 61 160 73 L 136 134 Z', 153, 68, 4.5, 6.5, 22)}
        `;
        break;

      case 6:
        // 6: THUMBS UP 👍
        gestureContent = `
          <path d="M 65 160 C 55 125 65 105 85 98 C 105 92 125 95 138 108 C 148 120 145 150 135 160 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <path d="M 88 112 C 110 114 135 114 135 124" stroke="${skinOutline}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          <path d="M 86 128 C 110 130 133 130 133 139" stroke="${skinOutline}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          <path d="M 84 144 C 108 146 130 146 130 154" stroke="${skinOutline}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          <path d="M 82 158 C 105 160 125 160 125 166" stroke="${skinOutline}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          ${finger('M 68 125 C 60 110 60 66 70 40 C 76 26 95 27 97 42 C 99 66 95 90 92 108 Z', 82, 42, 6, 8, 3)}
          <path d="M 72 68 C 80 66 88 68 94 70" stroke="${skinOutline}" stroke-width="3" fill="none"/>
          <circle cx="48" cy="38" r="5" fill="#facc15" class="six-sparkle"/>
          <circle cx="116" cy="33" r="4" fill="#fbbf24" class="six-sparkle"/>
          <circle cx="85" cy="16" r="6" fill="#f59e0b" class="six-sparkle"/>
        `;
        break;

      case 10:
        // 10: PUNCH / FIST 👊
        gestureContent = `
          <path d="M 55 135 C 50 100 65 80 100 80 C 135 80 150 100 145 135 C 145 155 135 165 100 168 C 65 165 55 155 55 135 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <circle cx="70" cy="98" r="14" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <circle cx="90" cy="94" r="15" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <circle cx="112" cy="95" r="15" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <circle cx="132" cy="100" r="13" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="3.5"/>
          <path d="M 56 128 C 65 142 90 145 125 138 C 130 132 130 120 120 118 C 95 122 75 115 65 110 Z"
                fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <path d="M 40 85 L 20 75" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
          <path d="M 45 65 L 30 50" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
          <path d="M 100 65 L 100 45" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>
          <path d="M 155 65 L 170 50" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
          <path d="M 160 85 L 180 75" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
        `;
        break;

      default:
        gestureContent = `<circle cx="100" cy="120" r="40" fill="${mainColor}" opacity="0.3"/>`;
    }

    // Crisp big number badge in the upper outer corner so the count is readable instantly alongside open fingers
    const badgeX = isBatsman ? 28 : 172;
    const badgeColor = v === 6 ? '#f59e0b' : (v === 10 ? '#ec4899' : mainColor);
    const badgeTextColor = v === 6 ? '#000' : '#fff';

    return `
      <svg viewBox="0 0 200 240" class="hand-svg hand-revealed ${isBatsman ? 'hand-left' : 'hand-right'}">
        <defs>
          <linearGradient id="skinGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${skinTone}" />
            <stop offset="100%" stop-color="${skinShadow}" />
          </linearGradient>
          <filter id="glow_${uid}">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${mainColor}" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_${uid})" transform="${mirrorTransform}">
          <rect x="70" y="160" width="60" height="65" rx="10" fill="url(#skinGrad_${uid})" stroke="${skinOutline}" stroke-width="4"/>
          <rect x="66" y="170" width="68" height="32" rx="6" fill="${bandColor}" stroke="#ffffff" stroke-width="2"/>
          ${gestureContent}
        </g>
        <!-- Wristband Text (un-mirrored so BOWL always reads forwards) -->
        <text x="100" y="191" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="1">${bandText}</text>
        <!-- Clear Finger Count Number Badge -->
        <circle cx="${badgeX}" cy="26" r="19" fill="${badgeColor}" stroke="#ffffff" stroke-width="2.5"/>
        <text x="${badgeX}" y="33" text-anchor="middle" font-size="${v === 10 ? '16' : '20'}" font-weight="900" fill="${badgeTextColor}">${v}</text>
      </svg>
    `;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandRenderer;
}
