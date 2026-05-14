import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import './ControlPanel.css';

export default function ControlPanel() {
  const [state, setState] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [minLvl, setMinLvl] = useState(14.0);
  const [maxLvl, setMaxLvl] = useState(14.9);

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

  if (!state) return <div className="cp-loading">Loading...</div>;

  const handleUpdatePlayers = (p1, p2) => {
    socket.emit('update_players', { player1: p1, player2: p2 });
  };

  const handleUpdateScore = (s1, s2) => {
    socket.emit('update_score', { player1Score: s1, player2Score: s2 });
  };

  const handleAddPreset = () => {
    if (newPresetName.trim()) {
      socket.emit('add_preset_player', newPresetName.trim());
      setNewPresetName('');
    }
  };

  const handleRandomize = () => {
    socket.emit('randomize_songs', { minLvl: parseFloat(minLvl), maxLvl: parseFloat(maxLvl) });
  };

  const handleSetPlaying = (slotId) => {
    socket.emit('set_playing_song', slotId);
  };

  const turnLabel = state.turn === 1
    ? `🔴 Player 1 (${state.player1.name})`
    : state.turn === 2
      ? `🔵 Player 2 (${state.player2.name})`
      : '✅ BAN xong — Sẵn sàng thi đấu';

  return (
    <div className="cp-container">
      {/* Header */}
      <header className="cp-header">
        <h1 className="cp-title">🎮 Admin Control Panel</h1>
        <button className="btn btn-danger" onClick={() => socket.emit('reset_match')}>
          Reset Match
        </button>
      </header>

      {/* Top Row: Players + Randomizer */}
      <div className="cp-row">
        {/* PLAYER MANAGEMENT */}
        <section className="cp-card">
          <h2 className="cp-card-title">👥 Player Setup</h2>

          <div className="cp-preset-add">
            <input
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              placeholder="Add new player name..."
              className="cp-input"
              onKeyDown={e => e.key === 'Enter' && handleAddPreset()}
            />
            <button onClick={handleAddPreset} className="btn btn-secondary">Add</button>
          </div>

          <div className="cp-players-row">
            <div className="cp-player-col">
              <h3 className="cp-player-label p1">Player 1</h3>
              <select
                value={state.player1.name}
                onChange={(e) => handleUpdatePlayers(e.target.value, state.player2.name)}
                className="cp-select"
              >
                <option value={state.player1.name}>{state.player1.name}</option>
                {state.presetPlayers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="cp-score-row">
                <label>Score</label>
                <input
                  type="number"
                  value={state.player1.score}
                  onChange={(e) => handleUpdateScore(parseInt(e.target.value) || 0, state.player2.score)}
                  className="cp-input cp-input-score"
                />
              </div>
            </div>

            <div className="cp-player-col">
              <h3 className="cp-player-label p2">Player 2</h3>
              <select
                value={state.player2.name}
                onChange={(e) => handleUpdatePlayers(state.player1.name, e.target.value)}
                className="cp-select"
              >
                <option value={state.player2.name}>{state.player2.name}</option>
                {state.presetPlayers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="cp-score-row">
                <label>Score</label>
                <input
                  type="number"
                  value={state.player2.score}
                  onChange={(e) => handleUpdateScore(state.player1.score, parseInt(e.target.value) || 0)}
                  className="cp-input cp-input-score"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SONG RANDOMIZER */}
        <section className="cp-card">
          <h2 className="cp-card-title">🎲 Randomize Songs</h2>
          <p className="cp-card-desc">Lọc bài hát theo Internal Level, random 5 bài.</p>

          <div className="cp-level-row">
            <div className="cp-level-field">
              <label>Min Level</label>
              <input type="number" step="0.1" value={minLvl} onChange={e => setMinLvl(e.target.value)} className="cp-input" />
            </div>
            <div className="cp-level-field">
              <label>Max Level</label>
              <input type="number" step="0.1" value={maxLvl} onChange={e => setMaxLvl(e.target.value)} className="cp-input" />
            </div>
          </div>

          <button onClick={handleRandomize} className="btn btn-success btn-full">
            🎵 Randomize 5 Songs
          </button>

          <div className="cp-status-bar">
            <span className="cp-status-label">Turn:</span>
            <span className={`cp-status-value turn-${state.turn}`}>{turnLabel}</span>
          </div>
        </section>
      </div>

      {/* Bottom: Song Slots */}
      <section className="cp-card cp-slots-section">
        <h2 className="cp-card-title">🎵 Ban / Pick Slots</h2>
        <div className="cp-slots-grid">
          {state.slots.map((slot, idx) => {
            const isPlaying = state.currentPlaying === idx;
            const isPicked = slot.action === 'pick';
            const isBanned = slot.action === 'ban';

            return (
              <div key={idx} className={`cp-slot ${slot.action || ''} ${isPlaying ? 'playing' : ''}`}>
                <div className="cp-slot-header">Slot {idx + 1}</div>

                {slot.song ? (
                  <>
                    <img
                      src={`http://localhost:3001/resources/img/cover-m/${slot.song.imageName}`}
                      alt={slot.song.title}
                      className="cp-slot-img"
                    />
                    <div className="cp-slot-title">{slot.song.title}</div>
                    <div className="cp-slot-meta">
                      {slot.sheet?.difficulty?.toUpperCase()} · Lv.{slot.sheet?.internalLevel || slot.sheet?.level}
                    </div>

                    {/* Action badge */}
                    {slot.action && (
                      <div className={`cp-slot-badge ${slot.action}`}>
                        {isBanned ? `BANNED (P${slot.by})` : 'PICKED'}
                      </div>
                    )}

                    {/* "Set as Playing" button — only for picked songs */}
                    {isPicked && (
                      <button
                        className={`btn btn-sm ${isPlaying ? 'btn-playing' : 'btn-outline'}`}
                        onClick={() => handleSetPlaying(isPlaying ? null : idx)}
                      >
                        {isPlaying ? '🔊 Now Playing' : '▶ Play This'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="cp-slot-empty">Empty</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
