import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import styles from './BracketOverlay.module.css';

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

export default function BracketOverlay() {
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

  if (!state || !state.bracket) return null;

  const getMatch = (id) => state.bracket.find(m => m.id === id);

  const MatchNode = ({ match, title }) => {
    if (!match) return null;
    return (
      <div className={cx("bracket-match")}>
        <div className={cx("match-title")}>{title}</div>
        <div className={cx(`match-player ${match.winner === 'p1' ? 'winner' : ''} ${match.winner === 'p2' ? 'loser' : ''}`)}>
          <div className={cx("player-name")}>{match.p1 || 'TBD'}</div>
        </div>
        <div className={cx(`match-player ${match.winner === 'p2' ? 'winner' : ''} ${match.winner === 'p1' ? 'loser' : ''}`)}>
          <div className={cx("player-name")}>{match.p2 || 'TBD'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={cx("bracket-overlay-container")}>
      <img
        src={`${SERVER}/resources/design/background.png`}
        alt="bg"
        className={cx("bracket-bg")}
        draggable={false}
      />
      <div className={cx("bracket-content")}>
        <h1 className={cx("bracket-header")}>BRACKET</h1>
        <div className={cx("bracket-grid")}>
          <div className={cx("bracket-col")}>
            <MatchNode match={getMatch(1)} title="Quarter Final 1" />
            <MatchNode match={getMatch(2)} title="Quarter Final 2" />
            <MatchNode match={getMatch(3)} title="Quarter Final 3" />
            <MatchNode match={getMatch(4)} title="Quarter Final 4" />
          </div>
          <div className={cx("bracket-col")}>
            <MatchNode match={getMatch(5)} title="Semi Final 1" />
            <MatchNode match={getMatch(6)} title="Semi Final 2" />
          </div>
          <div className={cx("bracket-col")}>
            <MatchNode match={getMatch(7)} title="Grand Final" />
          </div>
        </div>
      </div>
    </div>
  );
}
