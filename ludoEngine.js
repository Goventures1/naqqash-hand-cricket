// CLASSIC LUDO GAME ENGINE (SERVER-AUTHORITATIVE)
// Supports 2 to 4 Players, Token Moving, Safe Spots, Capturing, Home Stretch & Goal

const LUDO_COLORS = ['red', 'green', 'yellow', 'blue'];

const COLOR_CONFIG = {
  red: { startSq: 0, endSq: 50, homeBase: 100 },
  green: { startSq: 13, endSq: 11, homeBase: 110 },
  yellow: { startSq: 26, endSq: 24, homeBase: 120 },
  blue: { startSq: 39, endSq: 37, homeBase: 130 }
};

const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

class LudoGame {
  static createInitialState(players) {
    const ludoPlayers = players.slice(0, 4).map((p, idx) => ({
      id: p.id,
      name: p.name,
      color: LUDO_COLORS[idx],
      // 4 tokens: -1 = yard, 0-51 = track, 100+ = home stretch, 999 = goal
      tokens: [-1, -1, -1, -1],
      hasFinished: false,
      finishedTokens: 0
    }));

    return {
      players: ludoPlayers,
      turnIndex: 0,
      activeColor: ludoPlayers[0] ? ludoPlayers[0].color : 'red',
      diceValue: null,
      diceRolled: false,
      eligibleTokens: [],
      winner: null,
      history: []
    };
  }

  static rollDice(state, playerId) {
    const player = state.players[state.turnIndex];
    if (!player || player.id !== playerId) {
      return { success: false, error: 'Not your turn!' };
    }
    if (state.diceRolled) {
      return { success: false, error: 'Dice already rolled! Select a token to move.' };
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    state.diceValue = roll;
    state.diceRolled = true;

    // Determine eligible tokens for this roll
    state.eligibleTokens = [];
    player.tokens.forEach((pos, idx) => {
      if (this.canTokenMove(player.color, pos, roll)) {
        state.eligibleTokens.push(idx);
      }
    });

    // If no eligible tokens, turn passes
    if (state.eligibleTokens.length === 0) {
      setTimeout(() => {
        // will advance turn
      }, 800);
    }

    return {
      success: true,
      roll,
      eligibleTokens: state.eligibleTokens,
      player
    };
  }

  static canTokenMove(color, pos, roll) {
    if (pos === 999) return false; // already at goal
    if (pos === -1) return roll === 6; // needs 6 to leave yard

    const config = COLOR_CONFIG[color];

    // On home stretch
    if (pos >= config.homeBase) {
      const stepInHome = pos - config.homeBase;
      return (stepInHome + roll) <= 5; // 5 = goal
    }

    // On main track
    return true;
  }

  static moveToken(state, playerId, tokenIndex) {
    const player = state.players[state.turnIndex];
    if (!player || player.id !== playerId) {
      return { success: false, error: 'Not your turn!' };
    }
    if (!state.diceRolled) {
      return { success: false, error: 'Roll dice first!' };
    }
    if (!state.eligibleTokens.includes(tokenIndex)) {
      return { success: false, error: 'Invalid token move!' };
    }

    const roll = state.diceValue;
    const currentPos = player.tokens[tokenIndex];
    const config = COLOR_CONFIG[player.color];
    let newPos = currentPos;
    let captured = null;
    let extraTurn = roll === 6;

    if (currentPos === -1 && roll === 6) {
      newPos = config.startSq;
    } else if (currentPos >= config.homeBase) {
      const step = currentPos - config.homeBase + roll;
      if (step === 5) {
        newPos = 999; // Reached goal!
        player.finishedTokens++;
        extraTurn = true;
      } else {
        newPos = config.homeBase + step;
      }
    } else {
      // Moving on main track
      // Check if entering home stretch
      const distToEnd = (config.endSq >= currentPos) ? (config.endSq - currentPos) : (52 - currentPos + config.endSq);
      
      // Calculate steps
      if (roll > distToEnd) {
        // Enters home stretch
        const homeStep = (roll - distToEnd) - 1;
        if (homeStep === 5) {
          newPos = 999;
          player.finishedTokens++;
          extraTurn = true;
        } else {
          newPos = config.homeBase + homeStep;
        }
      } else {
        newPos = (currentPos + roll) % 52;
      }
    }

    // Check Capture on main track (if not safe square)
    if (newPos >= 0 && newPos < 52 && !SAFE_SQUARES.includes(newPos)) {
      state.players.forEach(otherP => {
        if (otherP.color !== player.color) {
          otherP.tokens.forEach((oPos, oIdx) => {
            if (oPos === newPos) {
              // Captured! Send back to yard
              otherP.tokens[oIdx] = -1;
              captured = { color: otherP.color, name: otherP.name, tokenIndex: oIdx };
              extraTurn = true; // Capture awards extra turn!
            }
          });
        }
      });
    }

    player.tokens[tokenIndex] = newPos;

    // Check Winner (First to reach 2 tokens in quick mode or 4 tokens in full)
    const tokensNeeded = 2; // Fast family fun!
    if (player.finishedTokens >= tokensNeeded) {
      state.winner = {
        id: player.id,
        name: player.name,
        color: player.color
      };
    }

    // Reset turn
    state.diceRolled = false;
    state.diceValue = null;
    state.eligibleTokens = [];

    if (!extraTurn && !state.winner) {
      state.turnIndex = (state.turnIndex + 1) % state.players.length;
      state.activeColor = state.players[state.turnIndex].color;
    }

    return {
      success: true,
      player,
      tokenIndex,
      prevPos: currentPos,
      newPos,
      captured,
      extraTurn,
      winner: state.winner
    };
  }

  static passTurn(state) {
    state.diceRolled = false;
    state.diceValue = null;
    state.eligibleTokens = [];
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    state.activeColor = state.players[state.turnIndex].color;
  }
}

module.exports = LudoGame;
