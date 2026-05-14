const fs = require('fs');
const path = require('path');

// Load initial data
const dataPath = path.join(__dirname, '../resources/data.json');
let songData = [];
try {
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const parsed = JSON.parse(rawData);
  songData = parsed.songs || [];
} catch (error) {
  console.error("Error loading data.json", error);
}

const presetPlayers = [
  "Player 1", "Player 2", "Kuro", "Shiro", "Rin", "Len", "Miku", "Luka"
];

const state = {
  player1: { name: "Player 1", score: 0 },
  player2: { name: "Player 2", score: 0 },
  presetPlayers: presetPlayers,
  turn: 1, // 1 for P1 ban, 2 for P2 ban, 0 for DONE
  currentPlaying: null, // slotId of the song currently being played on MatchOverlay
  slots: [
    { id: 0, song: null, action: null, by: null },
    { id: 1, song: null, action: null, by: null },
    { id: 2, song: null, action: null, by: null },
    { id: 3, song: null, action: null, by: null },
    { id: 4, song: null, action: null, by: null },
  ]
};

function getState() {
  return state;
}

function updatePlayers(p1Name, p2Name) {
  state.player1.name = p1Name;
  state.player2.name = p2Name;
}

function updateScore(p1Score, p2Score) {
  state.player1.score = p1Score;
  state.player2.score = p2Score;
}

function addPresetPlayer(name) {
  if (!state.presetPlayers.includes(name)) {
    state.presetPlayers.push(name);
  }
}

function randomizeSongs(minLvl, maxLvl) {
  // Build a list of { song, sheet } pairs where the sheet matches the level filter
  const validPairs = [];
  const seenSongs = new Set();

  songData.forEach(s => {
    s.sheets.forEach(sheet => {
      const lvl = sheet.internalLevelValue;
      if (lvl >= minLvl && lvl <= maxLvl && !seenSongs.has(s.songId)) {
        // Only pick difficulties that have an SVG frame: expert, master, remaster
        if (['expert', 'master', 'remaster'].includes(sheet.difficulty)) {
          validPairs.push({ song: s, sheet: sheet });
          seenSongs.add(s.songId);
        }
      }
    });
  });

  if (validPairs.length < 5) return false;

  // Shuffle and pick 5
  const shuffled = validPairs.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);

  state.slots = selected.map((pair, idx) => ({
    id: idx,
    song: pair.song,
    sheet: pair.sheet, // The specific sheet (difficulty) that was matched
    action: null,
    by: null
  }));

  state.turn = 1; // Reset turn to Player 1
  return true;
}

function banSlot(slotId, playerId) {
  // Check if it's the player's turn and game is not done
  if (state.turn !== playerId || state.turn === 0) return false;
  
  if (slotId >= 0 && slotId < 5 && state.slots[slotId].song && !state.slots[slotId].action) {
    state.slots[slotId].action = 'ban';
    state.slots[slotId].by = playerId;
    
    // Switch turn
    if (state.turn === 1) {
      state.turn = 2;
    } else if (state.turn === 2) {
      state.turn = 0; // Done banning
      // Auto pick remaining
      state.slots.forEach(slot => {
        if (!slot.action && slot.song) {
          slot.action = 'pick';
        }
      });
    }
    return true;
  }
  return false;
}

function setCurrentPlaying(slotId) {
  if (slotId === null || (slotId >= 0 && slotId < 5 && state.slots[slotId]?.action === 'pick')) {
    state.currentPlaying = slotId;
  }
}

function resetMatch() {
  state.player1.score = 0;
  state.player2.score = 0;
  state.turn = 1;
  state.currentPlaying = null;
  state.slots = state.slots.map(s => ({ id: s.id, song: null, action: null, by: null }));
}

module.exports = {
  songData,
  getState,
  updatePlayers,
  updateScore,
  addPresetPlayer,
  randomizeSongs,
  banSlot,
  setCurrentPlaying,
  resetMatch
};
