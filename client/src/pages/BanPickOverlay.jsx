import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import SongCard from '../components/SongCard';
import './BanPickOverlay.css';

const SERVER = 'http://localhost:3001';

export default function BanPickOverlay() {
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

  return (
    <div className="overlay-canvas">
      {/* Background image */}
      <img
        src={`${SERVER}/resources/design/background.png`}
        alt="bg"
        className="overlay-bg"
        draggable={false}
      />

      {/* 5 Song Cards stacked vertically on the left */}
      <div className="song-cards-column">
        {state.slots.map((slot, idx) => (
          <div key={idx} className={`song-card-slot s-${idx}`}>
            {slot.song ? (
              <SongCard
                song={slot.song}
                sheet={slot.sheet}
                action={slot.action}
              />
            ) : (
              <div className="empty-slot-overlay">SLOT {idx + 1}</div>
            )}
          </div>
        ))}
      </div>

      {/* Camera Frame (SVG) on the right */}
      <div className="camera-frame-area">
        <img
          src={`${SERVER}/resources/design/camera-frame.svg`}
          alt="camera frame"
          className="camera-frame-svg"
          draggable={false}
        />
      </div>

      {/* Player name boxes - positioned below camera frame */}
      <div className="player-box player-box-1">
        {state.player1.name}
      </div>
      <div className="player-box player-box-2">
        {state.player2.name}
      </div>
    </div>
  );
}
