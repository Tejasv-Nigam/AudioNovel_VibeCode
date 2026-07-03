import React from 'react';

interface ProgressBarProps {
  progressPercent: number;
  onSeek: (percent: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progressPercent, onSeek }) => {
  return (
    <div className="progress-container">
      <span className="time-display">{Math.floor(progressPercent)}%</span>
      <input 
        type="range" 
        className="seek-bar" 
        min="0" 
        max="100" 
        value={progressPercent} 
        onChange={(e) => onSeek(Number(e.target.value))} 
      />
      <span className="time-display">100%</span>
    </div>
  );
};
