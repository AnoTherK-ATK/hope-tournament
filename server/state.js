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

let onStateChangeCallback = null;
function setOnStateChange(cb) {
  onStateChangeCallback = cb;
}

// Watch players.json for real-time updates
fs.watchFile(playersPath, { interval: 1000 }, (curr, prev) => {
  try {
    const rawPlayers = fs.readFileSync(playersPath, 'utf8');
    const newPlayersData = JSON.parse(rawPlayers);
    state.players = newPlayersData;
    console.log("players.json reloaded in real time");
    if (onStateChangeCallback) {
      onStateChangeCallback(state);
    }
  } catch (error) {
    console.error("Error reloading players.json on change", error);
  }
});

const state = {
  player1: { name: "Player 1", score: 0 },
  player2: { name: "Player 2", score: 0 },
  players: playersData,
  match: { type: "Quarter Final", bracket: "Upper" },
  turn: 1, // 1 for P1 ban/pick, 2 for P2 ban/pick, 0 for DONE
  totalPicks: 0, // Number of picks allowed before ban phase
  currentPicks: 0,
  currentBans: 0,
  phase: 'ban', // 'pick', 'ban', or 'done'
  currentPlaying: null, // slotId of the song currently being played on MatchOverlay
  revealed: false, // Songs are hidden until admin reveals them
  slots: [
    { id: 0, song: null, action: null, by: null },
    { id: 1, song: null, action: null, by: null },
    { id: 2, song: null, action: null, by: null },
    { id: 3, song: null, action: null, by: null },
    { id: 4, song: null, action: null, by: null },
  ],
  bracket: [
    { id: 1, p1: "Player 1", p2: "Player 2", winner: null },
    { id: 2, p1: "Player 3", p2: "Player 4", winner: null },
    { id: 3, p1: "Player 5", p2: "Player 6", winner: null },
    { id: 4, p1: "Player 7", p2: "Player 8", winner: null },
    { id: 5, p1: "", p2: "", winner: null },
    { id: 6, p1: "", p2: "", winner: null },
    { id: 7, p1: "", p2: "", winner: null },
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
    const isCirclePlus = (s.version === "CiRCLE PLUS") || (s.version === "CiRCLE PLUS+");
    const isGotobun = s.title.includes("君だったから");
    s.sheets.forEach(sheet => {
      const lvl = sheet.internalLevelValue;
      const isIntl = sheet.regions?.intl === true;
      
      if (lvl >= minLvl && lvl <= maxLvl && !seenSongs.has(s.songId) && !isCirclePlus && !isGotobun) {
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
  state.currentPicks = 0;
  state.currentBans = 0;
  state.phase = state.totalPicks > 0 ? 'pick' : 'ban';
  state.currentPlaying = null;
  state.revealed = false;
  return true;
}

function banSlot(slotId, playerId) {
  // Check if it's the player's turn and game is not done
  if (state.turn !== playerId || state.turn === 0) return false;
  
  if (slotId >= 0 && slotId < 5 && state.slots[slotId].song && !state.slots[slotId].action) {
    if (state.phase === 'pick') {
      state.slots[slotId].action = 'protected_pick';
      state.slots[slotId].by = playerId;
      state.currentPicks++;
      
      if (state.currentPicks >= state.totalPicks) {
        state.phase = 'ban';
        state.turn = state.turn === 1 ? 2 : 1;
      } else {
        state.turn = state.turn === 1 ? 2 : 1;
      }
    } else if (state.phase === 'ban') {
      state.slots[slotId].action = 'ban';
      state.slots[slotId].by = playerId;
      state.currentBans++;
      
      if (state.currentBans >= 2) {
        state.turn = 0; // Done banning
        state.phase = 'done';
        // Auto pick remaining
        state.slots.forEach(slot => {
          if (!slot.action && slot.song) {
            slot.action = 'pick';
          }
        });
      } else {
        state.turn = state.turn === 1 ? 2 : 1;
      }
    }
    return true;
  }
  return false;
}

function setTotalPicks(count) {
  state.totalPicks = count;
  // If we haven't started interacting yet, update the phase immediately
  if (state.turn === 1 && state.slots.every(s => !s.action)) {
    state.phase = count > 0 ? 'pick' : 'ban';
  }
}

function setCurrentPlaying(slotId) {
  if (slotId === null || (slotId >= 0 && slotId < 5 && (state.slots[slotId]?.action === 'pick' || state.slots[slotId]?.action === 'protected_pick'))) {
    state.currentPlaying = slotId;
  }
}

function resetMatch() {
  state.player1.score = 0;
  state.player2.score = 0;
  state.turn = 1;
  state.currentPicks = 0;
  state.currentBans = 0;
  state.phase = state.totalPicks > 0 ? 'pick' : 'ban';
  state.currentPlaying = null;
  state.revealed = false;
  state.slots = state.slots.map(s => ({ id: s.id, song: null, action: null, by: null }));
}

function resetBanPick() {
  state.turn = 1;
  state.currentPicks = 0;
  state.currentBans = 0;
  state.phase = state.totalPicks > 0 ? 'pick' : 'ban';
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

const nextMatchMap = {
  1: { nextId: 5, slot: 'p1' },
  2: { nextId: 5, slot: 'p2' },
  3: { nextId: 6, slot: 'p1' },
  4: { nextId: 6, slot: 'p2' },
  5: { nextId: 7, slot: 'p1' },
  6: { nextId: 7, slot: 'p2' },
};

function advanceWinner(id) {
  const nextInfo = nextMatchMap[id];
  if (!nextInfo) return;

  const currentMatch = state.bracket.find(m => m.id === id);
  const nextMatch = state.bracket.find(m => m.id === nextInfo.nextId);

  if (currentMatch && nextMatch) {
    let winnerName = "";
    if (currentMatch.winner === 'p1') {
      winnerName = currentMatch.p1;
    } else if (currentMatch.winner === 'p2') {
      winnerName = currentMatch.p2;
    }

    const prevPlayerName = nextMatch[nextInfo.slot];
    if (prevPlayerName !== winnerName) {
      nextMatch[nextInfo.slot] = winnerName;
      nextMatch.winner = null;
      // Recursively advance/reset downstream matches
      advanceWinner(nextInfo.nextId);
    }
  }
}

function updateBracketMatch(id, data) {
  const match = state.bracket.find(m => m.id === id);
  if (match) {
    if (data.p1 !== undefined) match.p1 = data.p1;
    if (data.p2 !== undefined) match.p2 = data.p2;
    if (data.winner !== undefined) match.winner = data.winner;
    
    // Automatically advance/propagate winner to the next round
    advanceWinner(id);
  }
}

function randomizeBracket(source) {
  let pool = [];
  if (source === 'upper') {
    pool = [...(state.players.upper || [])];
  } else if (source === 'under') {
    pool = [...(state.players.under || [])];
  } else {
    pool = [...(state.players.upper || []), ...(state.players.under || [])];
  }

  // Shuffle
  pool.sort(() => 0.5 - Math.random());

  // Assign to QF
  for (let i = 0; i < 4; i++) {
    state.bracket[i].p1 = pool[i * 2] || "";
    state.bracket[i].p2 = pool[i * 2 + 1] || "";
    state.bracket[i].winner = null;
  }

  // Clear SF and GF
  for (let i = 4; i < 7; i++) {
    state.bracket[i].p1 = "";
    state.bracket[i].p2 = "";
    state.bracket[i].winner = null;
  }
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
  revealSongs,
  updateBracketMatch,
  randomizeBracket,
  setOnStateChange,
  setTotalPicks
};
