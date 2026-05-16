import React from 'react';
import './PlayerCamera.css';

const SERVER = '';

export default function PlayerCamera({ playerName }) {
  return (
    <div className="player-camera-container">
      {/* <img
        src={`${SERVER}/resources/design/camera-body.svg`}
        alt="camera body"
        className="camera-layer"
        draggable={false}
      /> */}
      <img
        src={`${SERVER}/resources/design/camera-header.svg`}
        alt="camera header"
        className="camera-layer"
        draggable={false}
      />
      <div className="camera-player-name">
        {playerName}
      </div>
    </div>
  );
}
