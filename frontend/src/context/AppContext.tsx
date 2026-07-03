import React, { createContext, useContext, useState, useEffect } from 'react';
import { HistoryItem, Bookmark, PlaybackSession } from '../types/models';

interface Settings {
  theme: string;
  voice: string;
  playbackSpeed: number;
  autoNextChapter: boolean;
}

interface AppContextType {
  history: HistoryItem[];
  addToHistory: (url: string, title?: string, progressPercent?: number) => void;
  bookmarks: Bookmark[];
  addBookmark: (url: string, title?: string) => void;
  removeBookmark: (url: string) => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  stats: {
    hoursListened: number;
    chaptersCompleted: number;
  };
  updateStats: (hours: number, chapters: number) => void;
  isPlaylistOpen: boolean;
  togglePlaylist: () => void;
  playbackSession: PlaybackSession | null;
  updatePlaybackSession: (updates: Partial<PlaybackSession>) => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  voice: 'male',
  playbackSpeed: 1.0,
  autoNextChapter: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('novel_history');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Migrate old string[] to HistoryItem[]
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map((url: string) => ({ url, title: url, progressPercent: 0, lastOpened: Date.now() }));
      }
      return parsed;
    } catch { return []; }
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('novel_bookmarks');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map((url: string) => ({ url, title: url, dateAdded: Date.now() }));
      }
      return parsed;
    } catch { return []; }
  });

  const [settings, setSettings] = useState<Settings>(() => JSON.parse(localStorage.getItem('novel_settings') || JSON.stringify(defaultSettings)));
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('novel_stats') || '{"hoursListened": 0, "chaptersCompleted": 0}'));
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  const [playbackSession, setPlaybackSession] = useState<PlaybackSession | null>(() => {
    const saved = localStorage.getItem('novel_playback_session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => { localStorage.setItem('novel_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('novel_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('novel_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('novel_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { 
    if (playbackSession) {
      localStorage.setItem('novel_playback_session', JSON.stringify(playbackSession)); 
    } else {
      localStorage.removeItem('novel_playback_session');
    }
  }, [playbackSession]);

  const addToHistory = (url: string, title?: string, progressPercent: number = 0) => {
    setHistory((prev) => {
      const existing = prev.find(h => h.url === url);
      const newItem: HistoryItem = {
        url,
        title: title || existing?.title || url,
        progressPercent: progressPercent || existing?.progressPercent || 0,
        lastOpened: Date.now()
      };
      return [newItem, ...prev.filter(h => h.url !== url)].slice(0, 50);
    });
  };

  const addBookmark = (url: string, title?: string) => {
    setBookmarks((prev) => {
      if (prev.some(b => b.url === url)) return prev;
      return [...prev, { url, title: title || url, dateAdded: Date.now() }];
    });
  };

  const removeBookmark = (url: string) => setBookmarks((prev) => prev.filter(u => u.url !== url));
  const updateSettings = (newSettings: Partial<Settings>) => setSettings((prev: Settings) => ({ ...prev, ...newSettings }));
  const updateStats = (hours: number, chapters: number) => setStats((prev: any) => ({
    hoursListened: prev.hoursListened + hours,
    chaptersCompleted: prev.chaptersCompleted + chapters
  }));
  const togglePlaylist = () => setIsPlaylistOpen(prev => !prev);

  const updatePlaybackSession = (updates: Partial<PlaybackSession>) => {
    setPlaybackSession(prev => {
      if (!prev && (!updates.chapterUrl || !updates.chapterTitle)) return null; 
      if (!prev) {
        return {
          id: 'current',
          chapterUrl: updates.chapterUrl!,
          chapterTitle: updates.chapterTitle!,
          progressPercent: updates.progressPercent || 0,
          lastUpdated: Date.now()
        };
      }
      return { ...prev, ...updates, lastUpdated: Date.now() };
    });
  };

  return (
    <AppContext.Provider value={{ 
      history, addToHistory, bookmarks, addBookmark, removeBookmark, 
      settings, updateSettings, stats, updateStats, isPlaylistOpen, togglePlaylist,
      playbackSession, updatePlaybackSession
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
