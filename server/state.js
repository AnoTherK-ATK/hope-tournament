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

let playersData = { upper: [], under: [] };
const playersPath = path.join(__dirname, '../resources/players.json');
try {
  if (fs.existsSync(playersPath)) {
    const rawPlayers = fs.readFileSync(playersPath, 'utf8');
    playersData = JSON.parse(rawPlayers);
  } else {
    // Write default if not exists
    playersData = { upper: ["Player 1", "Player 2"], under: ["Player 3", "Player 4"] };
    fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2), 'utf8');
  }
} catch (error) {
  console.error("Error loading players.json", error);
}

const state = {
  player1: { name: "Player 1", score: 0 },
  player2: { name: "Player 2", score: 0 },
  players: playersData,
  match: { type: "Quarter Final", bracket: "Upper" },
  turn: 1, // 1 for P1 ban, 2 for P2 ban, 0 for DONE
  currentPlaying: null, // slotId of the song currently being played on MatchOverlay
  revealed: false, // Songs are hidden until admin reveals them
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

function updateMatchInfo(type, bracket) {
  state.match.type = type;
  state.match.bracket = bracket;
}

function randomizeSongs(minLvl, maxLvl, count = 5) {
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

  if (validPairs.length < count) return false;

  // Shuffle and pick `count` songs
  const shuffled = validPairs.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  state.slots = selected.map((pair, idx) => ({
    id: idx,
    song: pair.song,
    sheet: pair.sheet, // The specific sheet (difficulty) that was matched
    action: null,
    by: null
  }));

  state.turn = 1; // Reset turn to Player 1
  state.currentPlaying = null;
  state.revealed = false;
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
  state.revealed = false;
  state.slots = state.slots.map(s => ({ id: s.id, song: null, action: null, by: null }));
}

function resetBanPick() {
  state.turn = 1;
  state.currentPlaying = null;
  state.revealed = false;
  state.slots = state.slots.map(s => ({
    ...s,
    action: null,
    by: null
  }));
}

function revealSongs() {
  state.revealed = true;
}

function addSongToSlot(songId, sheetType, sheetDifficulty) {
  // Find the song
  const song = songData.find(s => s.songId === songId);
  if (!song) return false;

  // Find the specific sheet
  const sheet = song.sheets.find(
    s => s.type === sheetType && s.difficulty === sheetDifficulty
  );
  if (!sheet) return false;

  // Find the first empty slot or append a new one
  const emptySlot = state.slots.find(s => !s.song);
  if (emptySlot) {
    emptySlot.song = song;
    emptySlot.sheet = sheet;
    emptySlot.action = null;
    emptySlot.by = null;
  } else {
    // Add a new slot
    state.slots.push({
      id: state.slots.length,
      song: song,
      sheet: sheet,
      action: null,
      by: null
    });
  }
  return true;
}

module.exports = {
  songData,
  getState,
  updatePlayers,
  updateScore,
  updateMatchInfo,
  randomizeSongs,
  banSlot,
  setCurrentPlaying,
  resetMatch,
  resetBanPick,
  addSongToSlot,
  revealSongs
};
