import React from 'react';
import styles from './MatchHeader.module.css';

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

export default function MatchHeader({ match, className = '' }) {
  return (
    <div className={`${cx("match-header")} ${className}`}>
      <div className={cx("match-title")}>{match?.type?.toUpperCase() || 'QUARTER FINALS'}</div>
      <div className={cx("match-subtitle")}>{match?.bracket || 'Under'}</div>
    </div>
  );
}

