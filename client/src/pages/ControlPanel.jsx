import React, { useEffect, useState, useMemo } from 'react';
import { socket } from '../lib/socket';
import styles from './ControlPanel.module.css';

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

// Difficulties that have SVG frames
const FRAME_DIFFICULTIES = ['expert', 'master', 'remaster'];

export default function ControlPanel() {
  const [state, setState] = useState(null);
  const [songs, setSongs] = useState([]);
  const [minLvl, setMinLvl] = useState(14.0);
  const [maxLvl, setMaxLvl] = useState(14.9);
  const [songCount, setSongCount] = useState(5);

  // Song search modal state
  const [showSongModal, setShowSongModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    socket.on('init_data', (data) => {
      setState(data.state);
      setSongs(data.songs || []);
    });

    socket.on('state_updated', (newState) => {
      setState(newState);
    });

    return () => {
      socket.off('init_data');
      socket.off('state_updated');
    };
  }, []);

  // Build flattened list of { song, sheet } pairs for the search modal
  const songSheetPairs = useMemo(() => {
    const pairs = [];
    songs.forEach(song => {
      song.sheets.forEach(sheet => {
        if (FRAME_DIFFICULTIES.includes(sheet.difficulty)) {
          pairs.push({ song, sheet });
        }
      });
    });
    return pairs;
  }, [songs]);

  // Filtered & sorted pairs
  const filteredPairs = useMemo(() => {
    let result = [...songSheetPairs];

    // Text search (title or artist)
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(p =>
        p.song.title.toLowerCase().includes(q) ||
        p.song.artist.toLowerCase().includes(q)
      );
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      result = result.filter(p => p.sheet.difficulty === filterDifficulty);
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(p => p.sheet.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'title':
          cmp = a.song.title.localeCompare(b.song.title);
          break;
        case 'artist':
          cmp = a.song.artist.localeCompare(b.song.artist);
          break;
        case 'level':
          cmp = (a.sheet.internalLevelValue || 0) - (b.sheet.internalLevelValue || 0);
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [songSheetPairs, searchText, filterDifficulty, filterType, sortBy, sortDir]);

  if (!state) return <div className={cx("cp-loading")}>Loading...</div>;

  const handleUpdatePlayers = (p1, p2) => {
    socket.emit('update_players', { player1: p1, player2: p2 });
  };

  const handleUpdateScore = (s1, s2) => {
    socket.emit('update_score', { player1Score: s1, player2Score: s2 });
  };

  const handleUpdateMatchInfo = (type, bracket) => {
    socket.emit('update_match_info', { type, bracket });
  };

  const handleRandomize = () => {
    socket.emit('randomize_songs', {
      minLvl: parseFloat(minLvl),
      maxLvl: parseFloat(maxLvl),
      count: parseInt(songCount) || 5
    });
  };

  const handleSetPlaying = (slotId) => {
    socket.emit('set_playing_song', slotId);
  };

  const handleResetBanPick = () => {
    socket.emit('reset_ban_pick');
  };

  const handleAddSong = (pair) => {
    socket.emit('add_song_to_slot', {
      songId: pair.song.songId,
      sheetType: pair.sheet.type,
      sheetDifficulty: pair.sheet.difficulty
    });
    setShowSongModal(false);
  };

  const openSongModal = () => {
    setSearchText('');
    setFilterDifficulty('all');
    setFilterType('all');
    setSortBy('title');
    setSortDir('asc');
    setShowSongModal(true);
  };

  const toggleSortDir = () => {
    setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const turnLabel = state.turn === 1
    ? `🔴 Player 1 (${state.player1.name})`
    : state.turn === 2
      ? `🔵 Player 2 (${state.player2.name})`
      : '✅ BAN xong — Sẵn sàng thi đấu';

  const hasSongs = state.slots.some(s => s.song);

  const DIFF_COLORS = {
    expert: '#ff5757',
    master: '#9d4edd',
    remaster: '#bd91e1'
  };

  return (
    <div className={cx("cp-container")}>
      {/* Header */}
      <header className={cx("cp-header")}>
        <h1 className={cx("cp-title")}>🎮 Admin Control Panel</h1>
        <div className={cx("cp-header-actions")}>
          {hasSongs && !state.revealed && (
            <button className={cx("btn btn-reveal")} onClick={() => socket.emit('reveal_songs')}>
              👁 Reveal Songs
            </button>
          )}
          {hasSongs && state.revealed && (
            <span className={cx("cp-revealed-badge")}>✅ Revealed</span>
          )}
          {hasSongs && (
            <button className={cx("btn btn-warning")} onClick={handleResetBanPick}>
              🔄 Reset Ban/Pick
            </button>
          )}
          <button className={cx("btn btn-danger")} onClick={() => socket.emit('reset_match')}>
            Reset Match
          </button>
        </div>
      </header>

      {/* Top Row: Players + Randomizer */}
      <div className={cx("cp-row")}>
        {/* PLAYER MANAGEMENT */}
        <section className={cx("cp-card")}>
          <h2 className={cx("cp-card-title")}>👥 Player Setup</h2>

          <div className={cx("cp-players-row")} style={{ marginBottom: '1rem' }}>
            <div className={cx("cp-player-col")}>
              <h3 className={cx("cp-player-label")}>Match Type</h3>
              <select
                value={state.match?.type || 'Quarter Final'}
                onChange={(e) => handleUpdateMatchInfo(e.target.value, state.match?.bracket)}
                className={cx("cp-select")}
              >
                <option value="Quarter Finals">Quarter Finals</option>
                <option value="Semi Finals">Semi Finals</option>
                <option value="Grand Finals">Grand Finals</option>
              </select>
            </div>
            <div className={cx("cp-player-col")}>
              <h3 className={cx("cp-player-label")}>Bracket</h3>
              <select
                value={state.match?.bracket || 'Upper'}
                onChange={(e) => handleUpdateMatchInfo(state.match?.type, e.target.value)}
                className={cx("cp-select")}
              >
                <option value="Upper">Upper</option>
                <option value="Under">Under</option>
              </select>
            </div>
          </div>

          <div className={cx("cp-players-row")}>
            <div className={cx("cp-player-col")}>
              <h3 className={cx("cp-player-label p1")}>Player 1</h3>
              <select
                value={state.player1.name}
                onChange={(e) => handleUpdatePlayers(e.target.value, state.player2.name)}
                className={cx("cp-select")}
              >
                <option value={state.player1.name}>{state.player1.name}</option>
                <optgroup label="Upper">
                  {state.players?.upper?.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label="Under">
                  {state.players?.under?.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              </select>
              <div className={cx("cp-score-row")}>
                <label>Score</label>
                <input
                  type="number"
                  value={state.player1.score}
                  onChange={(e) => handleUpdateScore(parseInt(e.target.value) || 0, state.player2.score)}
                  className={cx("cp-input cp-input-score")}
                />
              </div>
            </div>

            <div className={cx("cp-player-col")}>
              <h3 className={cx("cp-player-label p2")}>Player 2</h3>
              <select
                value={state.player2.name}
                onChange={(e) => handleUpdatePlayers(state.player1.name, e.target.value)}
                className={cx("cp-select")}
              >
                <option value={state.player2.name}>{state.player2.name}</option>
                <optgroup label="Upper Bracket">
                  {state.players?.upper?.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label="Under Bracket">
                  {state.players?.under?.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              </select>
              <div className={cx("cp-score-row")}>
                <label>Score</label>
                <input
                  type="number"
                  value={state.player2.score}
                  onChange={(e) => handleUpdateScore(state.player1.score, parseInt(e.target.value) || 0)}
                  className={cx("cp-input cp-input-score")}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SONG RANDOMIZER */}
        <section className={cx("cp-card")}>
          <h2 className={cx("cp-card-title")}>🎲 Randomize Songs</h2>
          <p className={cx("cp-card-desc")}>Lọc bài hát theo Internal Level, random theo số lượng.</p>

          <div className={cx("cp-level-row")}>
            <div className={cx("cp-level-field")}>
              <label>Min Level</label>
              <input type="number" step="0.1" value={minLvl} onChange={e => setMinLvl(e.target.value)} className={cx("cp-input")} />
            </div>
            <div className={cx("cp-level-field")}>
              <label>Max Level</label>
              <input type="number" step="0.1" value={maxLvl} onChange={e => setMaxLvl(e.target.value)} className={cx("cp-input")} />
            </div>
            <div className={cx("cp-level-field")}>
              <label>Số bài</label>
              <input
                type="number"
                min="1"
                max="20"
                value={songCount}
                onChange={e => setSongCount(e.target.value)}
                className={cx("cp-input")}
              />
            </div>
          </div>

          <button onClick={handleRandomize} className={cx("btn btn-success btn-full")}>
            🎵 Randomize {songCount} Songs
          </button>

          <div className={cx("cp-status-bar")}>
            <span className={cx("cp-status-label")}>Turn:</span>
            <span className={cx(`cp-status-value turn-${state.turn}`)}>{turnLabel}</span>
          </div>
        </section>
      </div>

      {/* Bottom: Song Slots */}
      <section className={cx("cp-card cp-slots-section")}>
        <div className={cx("cp-slots-header")}>
          <h2 className={cx("cp-card-title")}>🎵 Ban / Pick Slots</h2>
          <button className={cx("btn btn-secondary")} onClick={openSongModal}>
            ➕ Add Song
          </button>
        </div>
        <div className={cx("cp-slots-grid")}>
          {state.slots.map((slot, idx) => {
            const isPlaying = state.currentPlaying === idx;
            const isPicked = slot.action === 'pick';
            const isBanned = slot.action === 'ban';

            return (
              <div key={idx} className={cx(`cp-slot ${slot.action || ''} ${isPlaying ? 'playing' : ''}`)}>
                <div className={cx("cp-slot-header")}>Slot {idx + 1}</div>

                {slot.song ? (
                  <>
                    <img
                      src={`${SERVER}/resources/img/cover-m/${slot.song.imageName}`}
                      alt={slot.song.title}
                      className={cx("cp-slot-img")}
                    />
                    <div className={cx("cp-slot-title")}>{slot.song.title}</div>
                    <div className={cx("cp-slot-meta")}>
                      {slot.sheet?.difficulty?.toUpperCase()} · Lv.{slot.sheet?.internalLevel || slot.sheet?.level}
                    </div>

                    {/* Action badge */}
                    {slot.action && (
                      <div className={cx(`cp-slot-badge ${slot.action}`)}>
                        {isBanned ? `BANNED (P${slot.by})` : 'PICKED'}
                      </div>
                    )}

                    {/* "Set as Playing" button — only for picked songs */}
                    {isPicked && (
                      <button
                        className={cx(`btn btn-sm ${isPlaying ? 'btn-playing' : 'btn-outline'}`)}
                        onClick={() => handleSetPlaying(isPlaying ? null : idx)}
                      >
                        {isPlaying ? '🔊 Now Playing' : '▶ Play This'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className={cx("cp-slot-empty")}>Empty</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BRACKET MANAGEMENT */}
      <section className={cx("cp-card cp-bracket-section")}>
        <div className={cx("cp-slots-header")} style={{ flexWrap: 'wrap', gap: '10px' }}>
          <h2 className={cx("cp-card-title")}>🏆 Bracket Management</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={cx("btn btn-secondary btn-sm")} onClick={() => socket.emit('randomize_bracket', 'upper')}>🎲 Random Upper</button>
            <button className={cx("btn btn-secondary btn-sm")} onClick={() => socket.emit('randomize_bracket', 'under')}>🎲 Random Under</button>
            <button className={cx("btn btn-warning btn-sm")} onClick={() => socket.emit('randomize_bracket', 'all')}>🎲 Random All</button>
          </div>
        </div>
        <div className={cx("cp-bracket-grid")}>
          {state.bracket?.map(match => (
            <div key={match.id} className={cx("cp-bracket-match")}>
              <h4>Match {match.id}</h4>
              <div className={cx("cp-bracket-row")}>
                <input 
                  type="text" 
                  className={cx("cp-input")} 
                  placeholder="Player 1" 
                  value={match.p1 || ''}
                  onChange={(e) => socket.emit('update_bracket_match', { id: match.id, p1: e.target.value })}
                  readOnly={true}
                />
                <button 
                  className={cx(`btn btn-sm ${match.winner === 'p1' ? 'btn-success' : 'btn-outline'}`)}
                  onClick={() => socket.emit('update_bracket_match', { id: match.id, winner: match.winner === 'p1' ? null : 'p1' })}
                >
                  Win
                </button>
              </div>
              <div className={cx("cp-bracket-row")}>
                <input 
                  type="text" 
                  className={cx("cp-input")} 
                  placeholder="Player 2" 
                  value={match.p2 || ''}
                  onChange={(e) => socket.emit('update_bracket_match', { id: match.id, p2: e.target.value })}
                />
                <button 
                  className={cx(`btn btn-sm ${match.winner === 'p2' ? 'btn-success' : 'btn-outline'}`)}
                  onClick={() => socket.emit('update_bracket_match', { id: match.id, winner: match.winner === 'p2' ? null : 'p2' })}
                >
                  Win
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Song Search Modal */}
      {showSongModal && (
        <div className={cx("modal-overlay")} onClick={() => setShowSongModal(false)}>
          <div className={cx("modal-content")} onClick={e => e.stopPropagation()}>
            <div className={cx("modal-header")}>
              <h2 className={cx("modal-title")}>🔍 Add Song to Slot</h2>
              <button className={cx("modal-close")} onClick={() => setShowSongModal(false)}>✕</button>
            </div>

            {/* Search & Filters */}
            <div className={cx("modal-controls")}>
              <input
                type="text"
                className={cx("cp-input modal-search")}
                placeholder="Search by title or artist..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                autoFocus
              />

              <div className={cx("modal-filters")}>
                <div className={cx("modal-filter-group")}>
                  <label>Difficulty</label>
                  <select
                    className={cx("cp-select")}
                    value={filterDifficulty}
                    onChange={e => setFilterDifficulty(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="expert">Expert</option>
                    <option value="master">Master</option>
                    <option value="remaster">Re:Master</option>
                  </select>
                </div>

                <div className={cx("modal-filter-group")}>
                  <label>Type</label>
                  <select
                    className={cx("cp-select")}
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="std">Standard</option>
                    <option value="dx">DX</option>
                  </select>
                </div>

                <div className={cx("modal-filter-group")}>
                  <label>Sort by</label>
                  <select
                    className={cx("cp-select")}
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="title">Title</option>
                    <option value="artist">Artist</option>
                    <option value="level">Level</option>
                  </select>
                </div>

                <button className={cx("btn btn-secondary btn-sort-dir")} onClick={toggleSortDir}>
                  {sortDir === 'asc' ? '↑ ASC' : '↓ DESC'}
                </button>
              </div>
            </div>

            {/* Results count */}
            <div className={cx("modal-result-count")}>
              {filteredPairs.length} results
            </div>

            {/* Song List */}
            <div className={cx("modal-song-list")}>
              {filteredPairs.map((pair, i) => (
                <div
                  key={`${pair.song.songId}-${pair.sheet.type}-${pair.sheet.difficulty}-${i}`}
                  className={cx("modal-song-item")}
                  onClick={() => handleAddSong(pair)}
                >
                  <img
                    src={`${SERVER}/resources/img/cover-m/${pair.song.imageName}`}
                    alt={pair.song.title}
                    className={cx("modal-song-cover")}
                    loading="lazy"
                  />
                  <div className={cx("modal-song-info")}>
                    <div className={cx("modal-song-title")}>{pair.song.title}</div>
                    <div className={cx("modal-song-artist")}>{pair.song.artist}</div>
                  </div>
                  <div className={cx("modal-song-meta")}>
                    <span
                      className={cx("modal-song-diff")}
                      style={{ color: DIFF_COLORS[pair.sheet.difficulty] || '#888' }}
                    >
                      {pair.sheet.difficulty.toUpperCase()}
                    </span>
                    <span className={cx("modal-song-level")}>
                      Lv.{pair.sheet.internalLevel || pair.sheet.level}
                    </span>
                    <span className={cx("modal-song-type")}>
                      {pair.sheet.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
