import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import SongCard from '../components/SongCard';
import styles from './PlayerUI.module.css';

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

export default function PlayerUI() {
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

  if (!state) return <div className={cx("player-loading")}>Loading...</div>;

  const handleBan = (slotId) => {
    if (state.revealed && (state.turn === 1 || state.turn === 2)) {
      socket.emit('ban_slot', { slotId, playerId: state.turn });
    }
  };



  const hasSongs = state.slots.some(s => s.song);
  const canShowSongs = hasSongs && state.revealed;

  return (
    <>
      <title>Ban Pick</title>
      <div className={cx("player-ui-container")}>
        {/* Background */}
        <img
          src={`${SERVER}/resources/design/background.png`}
          alt="bg"
          className={cx("player-ui-bg")}
          draggable={false}
        />

        
        {canShowSongs ? (
          <div className={cx("player-cards-grid")}>
            {/* Row 1: 2 cards */}
            <div className={cx("player-cards-row")}>
              {state.slots.slice(0, 2).map((slot, idx) => (
                <div key={idx} className={cx("player-card-item")}>
                  {slot.song && (
                    <SongCard
                      song={slot.song}
                      sheet={slot.sheet}
                      action={slot.action}
                      onClick={() => !slot.action && state.turn !== 0 && handleBan(idx)}
                      className={cx(!slot.action && state.turn !== 0 ? 'clickable' : '')}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Row 2: 2 cards */}
            <div className={cx("player-cards-row")}>
              {state.slots.slice(2, 4).map((slot, realIdx) => {
                const idx = realIdx + 2;
                return (
                  <div key={idx} className={cx("player-card-item")}>
                    {slot.song && (
                      <SongCard
                        song={slot.song}
                        sheet={slot.sheet}
                        action={slot.action}
                        onClick={() => !slot.action && state.turn !== 0 && handleBan(idx)}
                        className={cx(!slot.action && state.turn !== 0 ? 'clickable' : '')}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Row 3: 1 card centered */}
            <div className={cx("player-cards-row center-row")}>
              {state.slots.slice(4, 5).map((slot) => {
                const idx = 4;
                return (
                  <div key={idx} className={cx("player-card-item")}>
                    {slot.song && (
                      <SongCard
                        song={slot.song}
                        sheet={slot.sheet}
                        action={slot.action}
                        onClick={() => !slot.action && state.turn !== 0 && handleBan(idx)}
                        className={cx(!slot.action && state.turn !== 0 ? 'clickable' : '')}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={cx("waiting-message")}>
            {hasSongs ? 'Đang chờ Admin reveal bài hát...' : 'Đang chờ Admin random bài hát...'}
          </div>
        )}
      </div>
    </>
  );
}
