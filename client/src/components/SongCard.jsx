import React from 'react';
import styles from './SongCard.module.css';

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

// Map difficulty to SVG frame file
const DIFFICULTY_SVG = {
  expert: 'expert.svg',
  master: 'master.svg',
  remaster: 'remas.svg',
};

// Map difficulty to display name (using Mokoto font)
const DIFFICULTY_LABEL = {
  expert: 'EXPERT',
  master: 'MASTER',
  remaster: 'RE:MASTER',
};

// Map difficulty to color for fallback / accents
const DIFFICULTY_COLOR = {
  expert: '#ff5757',
  master: '#9d4edd',
  remaster: '#bd91e1',
};

/**
 * SongCard component
 * Renders a song card matching the maimai tournament design.
 * 
 * Props:
 * - song: song object from data.json (title, imageName, sheets, etc.)
 * - sheet: the specific sheet (difficulty) to display. If null, uses the highest available.
 * - action: 'ban' | 'pick' | null
 * - className: optional extra CSS classes
 * - onClick: optional click handler
 * - style: optional inline styles
 */
export default function SongCard({ song, sheet, action, className = '', onClick, style }) {
  if (!song) return null;

  // Determine the sheet to display
  const displaySheet = sheet || getBestSheet(song);
  const difficulty = displaySheet?.difficulty || 'expert';
  const type = displaySheet?.type || 'std'; // 'std' or 'dx'
  const level = displaySheet?.level || '?';
  const svgFile = DIFFICULTY_SVG[difficulty] || DIFFICULTY_SVG.expert;
  const diffLabel = DIFFICULTY_LABEL[difficulty] || difficulty.toUpperCase();
  const diffColor = DIFFICULTY_COLOR[difficulty] || '#ff5757';

  // Type icon
  const typeIcon = type === 'dx' ? 'type-dx.png' : 'type-std.png';

  return (
    <div
      className={cx(`song-card-wrapper ${action || ''} ${className}`)}
      onClick={onClick}
      style={style}
    >
      {/* SVG Frame as background */}
      <div className={cx("song-card-frame")}>
        <img
          src={`${SERVER}/resources/design/${svgFile}`}
          alt="frame"
          className={cx("frame-svg")}
          draggable={false}
        />
      </div>

      {/* Jacket image - positioned inside the left area of the SVG frame */}
      <div className={cx("song-card-jacket")}>
        <img
          src={`${SERVER}/resources/img/cover/${song.imageName}`}
          alt={song.title}
          className={cx("jacket-img")}
          draggable={false}
        />
      </div>

      {/* Top colored band - type icon + difficulty label */}
      <div className={cx("song-card-top-band")}>
        <img
          src={`${SERVER}/resources/img/${typeIcon}`}
          alt={type}
          className={cx("type-icon")}
          draggable={false}
        />
        <div className={cx("difficulty-label")}>
          {diffLabel}
        </div>
      </div>

      {/* Song info - on the white polygon area (below the top band) */}
      <div className={cx("song-card-info")}>
        {/* Level */}
        <div className={cx("level-text")} style={{ color: diffColor }}>{level}</div>

        {/* Song title */}
        <div className={cx("title-text")} style={{ color: diffColor }}>{song.title}</div>
      </div>

      {/* Banned overlay */}
      {action === 'ban' && (
        <div className={cx("ban-overlay")}>
          <div className={cx("ban-text")}>BANNED</div>
        </div>
      )}
    </div>
  );
}

function getBestSheet(song) {
  if (!song.sheets || song.sheets.length === 0) return null;
  // Prefer master > remaster > expert > advanced > basic
  const priority = ['remaster', 'master', 'expert', 'advanced', 'basic'];
  for (const diff of priority) {
    const found = song.sheets.find(s => s.difficulty === diff);
    if (found) return found;
  }
  return song.sheets[song.sheets.length - 1];
}
