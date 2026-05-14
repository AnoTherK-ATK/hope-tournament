import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import SongCard from '../components/SongCard';
import './MatchOverlay.css';

const SERVER = 'http://localhost:3001';

export default function MatchOverlay() {
  const [state, setState] = useState(null);

  useEffect(() => {
    socket.on('init_data', (data) => {
      setState(data.state);
    });

    socket.on('state_updated', (newState) => {
      setState(newState);
    });

    return () => {
      socket.off('init_data');
      socket.off('state_updated');
    };
  }, []);

  if (!state) return null;

  // Use admin-controlled currentPlaying slot
  const playingSlot = state.currentPlaying !== null ? state.slots[state.currentPlaying] : null;
  const currentSong = playingSlot?.action === 'pick' ? playingSlot : null;

  return (
    <div className="match-overlay-container">
      {/* Background */}
      <img
        src={`${SERVER}/resources/design/background.png`}
        alt="bg"
        className="match-bg"
        draggable={false}
      />

      {/* Header title area */}
      <div className="match-header">
        <div className="match-title">QUARTER FINAL</div>
        <div className="match-subtitle">Under</div>
      </div>

      {/* Current Song Card (centered, between header and cameras) */}
      {currentSong && currentSong.song && (
        <div className="match-current-song">
          <SongCard
            song={currentSong.song}
            sheet={currentSong.sheet}
            action={null}
          />
        </div>
      )}

      {/* Two camera frames side by side */}
      <div className="match-cameras">
        {/* Left camera (Player 1) */}
        <div className="match-cam-wrapper">
          <img
            src={`${SERVER}/resources/design/camera-frame.svg`}
            alt="camera frame"
            className="match-cam-svg"
            draggable={false}
          />
        </div>

        {/* Center divider area (transparent, the background shows through) */}
        <div className="match-divider"></div>

        {/* Right camera (Player 2) */}
        <div className="match-cam-wrapper">
          <img
            src={`${SERVER}/resources/design/camera-frame.svg`}
            alt="camera frame"
            className="match-cam-svg"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
