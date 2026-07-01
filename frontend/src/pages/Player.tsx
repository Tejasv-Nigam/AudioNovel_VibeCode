import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, BookOpen, RotateCcw, RotateCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Player: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const originalUrl = searchParams.get('url');

  const { settings, updateStats, addBookmark } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chapter, setChapter] = useState<{ title: string; content: string; nextChapterUrl: string | null } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load Chapter
  useEffect(() => {
    if (!originalUrl) return;

    let isMounted = true;
    const fetchChapter = async () => {
      setIsLoading(true);
      setError(null);
      setChapter(null);
      setAudioUrl(null);
      setIsPlaying(false);
      setProgress(0);

      try {
        const extRes = await fetch('http://localhost:3000/api/extraction/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: originalUrl })
        });
        const extData = await extRes.json();
        
        if (!extData.success || !isMounted) {
          throw new Error(extData.message || 'Extraction failed');
        }

        setChapter(extData.data);

        // Fetch TTS
        const ttsRes = await fetch('http://localhost:3000/api/tts/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extData.data.content })
        });

        if (!ttsRes.ok) throw new Error('Failed to synthesize audio');
        
        const blob = await ttsRes.blob();
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred.');
          setIsLoading(false);
        }
      }
    };

    fetchChapter();

    return () => {
      isMounted = false;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl]);

  // Apply Settings (Playback Speed)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackSpeed;
    }
  }, [settings.playbackSpeed, audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    
    // Update stats
    if (duration > 0) {
      updateStats(duration / 3600, 1);
    }

    if (settings.autoNextChapter && chapter?.nextChapterUrl) {
       navigate(`/player?url=${encodeURIComponent(chapter.nextChapterUrl)}`);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      if (vol > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      <header>
        <h1 className="heading-lg" style={{ marginBottom: '8px' }}>Now Playing</h1>
      </header>

      {error && (
        <div className="glass-panel" style={{ borderColor: 'red' }}>
          <h2 style={{ color: 'red' }}>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <Loader2 className="spinner" size={48} color="var(--accent-primary)" />
          <p className="text-muted">Extracting and synthesizing chapter...</p>
        </div>
      )}

      {!isLoading && !error && chapter && (
        <>
          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--accent-primary)' }}>{chapter.title}</h2>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              {chapter.content}
            </div>
          </div>

          <div className="glass-panel player-controls-panel">
            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onTimeUpdate={handleTimeUpdate} 
                onEnded={handleEnded} 
                onLoadedMetadata={handleTimeUpdate}
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            <div className="progress-container">
              <span className="time-display">{formatTime(progress)}</span>
              <input 
                type="range" 
                className="seek-bar" 
                min="0" 
                max={duration || 0} 
                value={progress} 
                onChange={handleSeek} 
              />
              <span className="time-display">{formatTime(duration)}</span>
            </div>

            <div className="controls-row">
              <div className="side-controls">
                <button className="icon-btn" title="Bookmark this chapter" onClick={() => { if(originalUrl) addBookmark(originalUrl); }}>
                  <BookOpen size={20} />
                </button>
              </div>

              <div className="main-controls">
                <button className="icon-btn" onClick={() => handleSkip(-10)} title="Rewind 10s"><RotateCcw size={24} /></button>
                <button className="icon-btn" onClick={() => navigate(-1)} title="Previous Chapter (History)"><SkipBack size={24} /></button>
                
                <button className="play-btn" onClick={togglePlay}>
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>

                <button className="icon-btn" onClick={() => { if (chapter.nextChapterUrl) navigate(`/player?url=${encodeURIComponent(chapter.nextChapterUrl)}`) }} disabled={!chapter.nextChapterUrl} title="Next Chapter"><SkipForward size={24} /></button>
                <button className="icon-btn" onClick={() => handleSkip(10)} title="Forward 10s"><RotateCw size={24} /></button>
              </div>

              <div className="side-controls volume-controls">
                <button className="icon-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input 
                  type="range" 
                  className="seek-bar volume-bar" 
                  min="0" max="1" step="0.01" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolume} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Player;
