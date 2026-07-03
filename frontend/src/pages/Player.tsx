import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, List, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useStreamingAudio } from '../hooks/useStreamingAudio';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { TextRenderer } from '../components/player/TextRenderer';
import { ProgressBar } from '../components/player/ProgressBar';
import { PlayerControls } from '../components/player/PlayerControls';

const Player: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const originalUrl = searchParams.get('url');

  const { settings, updateSettings, updateStats, addBookmark, history, addToHistory, isPlaylistOpen, togglePlaylist, playbackSession, updatePlaybackSession } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chapter, setChapter] = useState<{ title: string; content: string; nextChapterUrl: string | null } | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const handleChapterEnd = () => {
    updateStats(0, 1);
    if (settings.autoNextChapter && chapter?.nextChapterUrl) {
       // Continuous Reading Mode transition
       navigate(`/player?url=${encodeURIComponent(chapter.nextChapterUrl)}`);
    }
  };

  const isContinuingSession = playbackSession && playbackSession.chapterUrl === originalUrl;

  const {
    audioRefA,
    audioRefB,
    activeAudio,
    isPlaying,
    isBuffering,
    progressPercent,
    activeSentenceIndex,
    sentences,
    togglePlay,
    handleEnded,
    handleTimeUpdate,
    handleSeek,
    handleSkip,
  } = useStreamingAudio({
    chapter,
    voice: settings.voice,
    playbackSpeed: settings.playbackSpeed,
    initialProgressPercent: isContinuingSession ? playbackSession.progressPercent : 0,
    onChapterEnd: handleChapterEnd
  });

  // Load Chapter
  useEffect(() => {
    if (!originalUrl) return;

    const abortController = new AbortController();
    let isMounted = true;

    const fetchChapter = async () => {
      setIsLoading(true);
      setError(null);
      setChapter(null);

      try {
        // Validate URL locally before requesting
        const parsedUrl = new URL(originalUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          throw new Error('Only HTTP and HTTPS URLs are supported.');
        }

        const extRes = await fetch('http://localhost:3000/api/extraction/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: originalUrl }),
          signal: abortController.signal
        });
        const extData = await extRes.json();
        
        if (!extData.success || !isMounted) {
          throw new Error(extData.message || 'Extraction failed');
        }

        if (isMounted) {
          setChapter(extData.data);
          setIsLoading(false);
          addToHistory(originalUrl, extData.data.title, isContinuingSession ? playbackSession.progressPercent : 0);
          updatePlaybackSession({
            chapterUrl: originalUrl,
            chapterTitle: extData.data.title,
            progressPercent: isContinuingSession ? playbackSession.progressPercent : 0
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted for URL:', originalUrl);
          return;
        }
        if (isMounted) {
          setError(err.message || 'An error occurred.');
          setIsLoading(false);
        }
      }
    };

    fetchChapter();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl]); // Removed settings.voice because it's handled by useStreamingAudio hook now

  // Save progress periodically (debounced)
  useEffect(() => {
    if (!originalUrl || !chapter || progressPercent === 0) return;
    const timeout = setTimeout(() => {
      updatePlaybackSession({ progressPercent });
      addToHistory(originalUrl, chapter.title, progressPercent);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [progressPercent, originalUrl, chapter, updatePlaybackSession, addToHistory]);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (textContainerRef.current) {
      const activeElement = textContainerRef.current.querySelector('.highlight-active');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSentenceIndex]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRefA.current) audioRefA.current.muted = newMuted;
    if (audioRefB.current) audioRefB.current.muted = newMuted;
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRefA.current) audioRefA.current.volume = vol;
    if (audioRefB.current) audioRefB.current.volume = vol;
    
    if (vol > 0 && isMuted) {
      setIsMuted(false);
      if (audioRefA.current) audioRefA.current.muted = false;
      if (audioRefB.current) audioRefB.current.muted = false;
    }
  };

  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onSkipForward: () => handleSkip(10),
    onSkipBackward: () => handleSkip(-10),
    onVolumeUp: () => handleVolume({ target: { value: Math.min(volume + 0.1, 1).toString() } } as any),
    onVolumeDown: () => handleVolume({ target: { value: Math.max(volume - 0.1, 0).toString() } } as any),
    onToggleMute: toggleMute,
    isEnabled: !isLoading && !!chapter
  });

  return (
    <div className="player-container animate-in">
      <div className="player-main">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="heading-lg" style={{ marginBottom: '8px' }}>Now Playing</h1>
          <button className="icon-btn" onClick={togglePlaylist} title="Toggle Playlist" style={{ background: isPlaylistOpen ? 'var(--accent-primary)' : 'transparent', padding: '8px', borderRadius: '8px' }}>
            <List size={24} color={isPlaylistOpen ? 'white' : 'currentColor'} />
          </button>
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
            <p className="text-muted">Extracting chapter text...</p>
          </div>
        )}

        {!isLoading && !error && chapter && (
          <>
            <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', position: 'relative' }} ref={textContainerRef}>
              <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--accent-primary)' }}>{chapter.title}</h2>
              <TextRenderer sentences={sentences} activeIndex={activeSentenceIndex} />
            </div>

            <div className="glass-panel player-controls-panel">
              <audio 
                ref={audioRefA} 
                onTimeUpdate={activeAudio === 'A' ? handleTimeUpdate : undefined} 
                onEnded={activeAudio === 'A' ? handleEnded : undefined} 
              />
              <audio 
                ref={audioRefB} 
                onTimeUpdate={activeAudio === 'B' ? handleTimeUpdate : undefined} 
                onEnded={activeAudio === 'B' ? handleEnded : undefined} 
              />

              <ProgressBar 
                progressPercent={progressPercent} 
                onSeek={handleSeek} 
              />

              <PlayerControls 
                isPlaying={isPlaying}
                isBuffering={isBuffering}
                isMuted={isMuted}
                volume={volume}
                playbackSpeed={settings.playbackSpeed}
                hasNextChapter={!!chapter.nextChapterUrl}
                onTogglePlay={togglePlay}
                onToggleMute={toggleMute}
                onVolumeChange={handleVolume}
                onSpeedChange={(speed) => updateSettings({ playbackSpeed: speed })}
                onSkip={handleSkip}
                onPreviousChapter={() => navigate(-1)}
                onNextChapter={() => { if (chapter.nextChapterUrl) navigate(`/player?url=${encodeURIComponent(chapter.nextChapterUrl)}`); }}
                onBookmark={() => { if(originalUrl) addBookmark(originalUrl); }}
              />
            </div>
          </>
        )}
      </div>

      {/* Playlist Drawer */}
      <div className={`playlist-drawer glass-panel ${isPlaylistOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>History / Queue</h3>
          <button className="icon-btn" onClick={togglePlaylist}><X size={20}/></button>
        </div>
        <div className="drawer-content">
          {history.length === 0 ? (
            <p className="text-muted text-center" style={{marginTop: '20px'}}>No history available.</p>
          ) : (
            history.map((h, i) => (
              <div 
                key={i} 
                className={`playlist-item ${h.url === originalUrl ? 'active' : ''}`}
                onClick={() => navigate(`/player?url=${encodeURIComponent(h.url)}`)}
              >
                {h.title} <span style={{float: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{Math.floor(h.progressPercent)}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Player;
