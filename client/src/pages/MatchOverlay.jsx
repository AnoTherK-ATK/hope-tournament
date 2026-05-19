import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import SongCard from '../components/SongCard';
import MatchHeader from '../components/MatchHeader';
import PlayerCamera from '../components/PlayerCamera';
import styles from './MatchOverlay.module.css';

const cx = (...classes) => {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter(Boolean)
    .map(c => styles[c] || c)
    .join(' ');
};

const SERVER = '';

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
    <div className={cx("match-overlay-container")}>
      {/* Background */}
      <img
        src={`${SERVER}/resources/design/background.png`}
        alt="bg"
        className={cx("match-bg")}
        draggable={false}
      />

      {/* Match Header */}
      <MatchHeader match={state.match} />

      {/* Current Song Card (centered, between header and cameras) */}
      {currentSong && currentSong.song && (
        <div className={cx("match-current-song")}>
          <SongCard
            song={currentSong.song}
            sheet={currentSong.sheet}
            action={null}
          />
        </div>
      )}

      {/* Two camera frames side by side */}
      <div className={cx("match-cameras")}>
        {/* Left camera (Player 1) */}
        <div className={cx("match-cam-wrapper")}>
          <PlayerCamera playerName={state.player1?.name} />
        </div>

        {/* Center divider area (transparent, the background shows through) */}
        <div className={cx("match-divider")}></div>

        {/* Right camera (Player 2) */}
        <div className={cx("match-cam-wrapper")}>
          <PlayerCamera playerName={state.player2?.name} />
        </div>
      </div>
    </div>
  );
}
