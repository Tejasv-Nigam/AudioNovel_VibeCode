import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onTogglePlay: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  isEnabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onTogglePlay,
  onSkipForward,
  onSkipBackward,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  isEnabled = true
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSkipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSkipBackward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeDown();
          break;
        case 'KeyM':
          e.preventDefault();
          onToggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, onTogglePlay, onSkipForward, onSkipBackward, onVolumeUp, onVolumeDown, onToggleMute]);
};
