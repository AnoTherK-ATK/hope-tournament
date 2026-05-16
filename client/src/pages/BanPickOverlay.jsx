import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import SongCard from '../components/SongCard';
import MatchHeader from '../components/MatchHeader';
import './BanPickOverlay.css';

const SERVER = '';

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

      {/* Match Header */}
      <MatchHeader match={state.match} className="match-header" />

      {/* 5 Song Cards stacked vertically on the left */}
      <div className="song-cards-column">
        {state.slots.map((slot, idx) => (
          <div key={idx} className={`song-card-slot s-${idx}`}>
            {slot.song && state.revealed ? (
              <SongCard
                song={slot.song}
                sheet={slot.sheet}
                action={slot.action}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Camera Frame (SVG) on the right */}
      {/* <div className="camera-frame-area">
        <img
          src={`${SERVER}/resources/design/camera-frame.svg`}
          alt="camera frame"
          className="camera-frame-svg"
          draggable={false}
        />
      </div> */}

      
    </div>
  );
}
