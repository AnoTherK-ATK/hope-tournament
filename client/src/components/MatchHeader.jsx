import React from 'react';
import './MatchHeader.css';

export default function MatchHeader({ match }) {
  return (
    <div className="match-header">
      <div className="match-title">{match?.type?.toUpperCase() || 'QUARTER FINALS'}</div>
      <div className="match-subtitle">{match?.bracket || 'Under'}</div>
    </div>
  );
}
