import React from 'react';
import styles from './PlayerCamera.module.css';

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

export default function PlayerCamera({ playerName }) {
  return (
    <div className={cx("player-camera-container")}>
      {/* <img
        src={`${SERVER}/resources/design/camera-body.svg`}
        alt="camera body"
        className={cx("camera-layer")}
        draggable={false}
      /> */}
      <img
        src={`${SERVER}/resources/design/camera-header.svg`}
        alt="camera header"
        className={cx("camera-layer")}
        draggable={false}
      />
      <div className={cx("camera-player-name")}>
        {playerName}
      </div>
    </div>
  );
}
