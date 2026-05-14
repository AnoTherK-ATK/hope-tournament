const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const stateManager = require('./state');

const app = express();
const server = http.createServer(app);

// Enable CORS for client
app.use(cors({
  origin: '*'
}));

// Serve static resources (images, data.json)
app.use('/resources', express.static(path.join(__dirname, '../resources')));

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state and songs
  socket.emit('init_data', {
    state: stateManager.getState(),
    songs: stateManager.songData
  });

  socket.on('update_players', (data) => {
    stateManager.updatePlayers(data.player1, data.player2);
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('update_score', (data) => {
    stateManager.updateScore(data.player1Score, data.player2Score);
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('add_preset_player', (name) => {
    stateManager.addPresetPlayer(name);
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('randomize_songs', (data) => {
    // data = { minLvl, maxLvl }
    stateManager.randomizeSongs(data.minLvl, data.maxLvl);
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('ban_slot', (data) => {
    // data = { slotId, playerId }
    stateManager.banSlot(data.slotId, data.playerId);
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('set_playing_song', (slotId) => {
    stateManager.setCurrentPlaying(slotId);
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('reset_match', () => {
    stateManager.resetMatch();
    io.emit('state_updated', stateManager.getState());
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
