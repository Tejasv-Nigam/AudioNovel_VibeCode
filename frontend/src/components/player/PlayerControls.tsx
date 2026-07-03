import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, BookOpen, RotateCcw, RotateCw } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  isBuffering: boolean;
  isMuted: boolean;
  volume: number;
  playbackSpeed: number;
  hasNextChapter: boolean;
  
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSpeedChange: (speed: number) => void;
  onSkip: (seconds: number) => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onBookmark: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isBuffering,
  isMuted,
  volume,
  playbackSpeed,
  hasNextChapter,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSpeedChange,
  onSkip,
  onPreviousChapter,
  onNextChapter,
  onBookmark,
}) => {
  return (
    <div className="controls-row">
      <div className="side-controls">
        <button className="icon-btn" title="Bookmark this chapter" onClick={onBookmark}>
          <BookOpen size={20} />
        </button>
      </div>

      <div className="main-controls">
        <select 
          className="speed-select"
          value={playbackSpeed} 
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          title="Playback Speed"
        >
          <option value={0.75}>0.75x</option>
          <option value={1.0}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2.0}>2x</option>
        </select>

        <button className="icon-btn" onClick={() => onSkip(-10)} title="Rewind 10s"><RotateCcw size={24} /></button>
        <button className="icon-btn" onClick={onPreviousChapter} title="Previous Chapter (History)"><SkipBack size={24} /></button>
        
        <button className="play-btn" onClick={onTogglePlay}>
          {isBuffering ? <Loader2 className="spinner" size={32} /> : (isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />)}
        </button>

        <button className="icon-btn" onClick={onNextChapter} disabled={!hasNextChapter} title="Next Chapter"><SkipForward size={24} /></button>
        <button className="icon-btn" onClick={() => onSkip(10)} title="Forward 10s"><RotateCw size={24} /></button>
      </div>

      <div className="side-controls volume-controls">
        <button className="icon-btn" onClick={onToggleMute}>
          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input 
          type="range" 
          className="seek-bar volume-bar" 
          min="0" max="1" step="0.01" 
          value={isMuted ? 0 : volume} 
          onChange={onVolumeChange} 
        />
      </div>
    </div>
  );
};
