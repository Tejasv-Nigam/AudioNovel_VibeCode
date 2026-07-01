import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  theme: string;
  voice: string;
  playbackSpeed: number;
  autoNextChapter: boolean;
}

interface AppContextType {
  history: string[];
  addToHistory: (url: string) => void;
  bookmarks: string[];
  addBookmark: (url: string) => void;
  removeBookmark: (url: string) => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  stats: {
    hoursListened: number;
    chaptersCompleted: number;
  };
  updateStats: (hours: number, chapters: number) => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  voice: 'default',
  playbackSpeed: 1.0,
  autoNextChapter: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<string[]>(() => JSON.parse(localStorage.getItem('novel_history') || '[]'));
  const [bookmarks, setBookmarks] = useState<string[]>(() => JSON.parse(localStorage.getItem('novel_bookmarks') || '[]'));
  const [settings, setSettings] = useState<Settings>(() => JSON.parse(localStorage.getItem('novel_settings') || JSON.stringify(defaultSettings)));
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('novel_stats') || '{"hoursListened": 0, "chaptersCompleted": 0}'));

  useEffect(() => { localStorage.setItem('novel_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('novel_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('novel_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('novel_stats', JSON.stringify(stats)); }, [stats]);

  const addToHistory = (url: string) => setHistory((prev: string[]) => [url, ...prev.filter(u => u !== url)].slice(0, 20));
  const addBookmark = (url: string) => setBookmarks((prev: string[]) => prev.includes(url) ? prev : [...prev, url]);
  const removeBookmark = (url: string) => setBookmarks((prev: string[]) => prev.filter(u => u !== url));
  const updateSettings = (newSettings: Partial<Settings>) => setSettings((prev: Settings) => ({ ...prev, ...newSettings }));
  const updateStats = (hours: number, chapters: number) => setStats((prev: any) => ({
    hoursListened: prev.hoursListened + hours,
    chaptersCompleted: prev.chaptersCompleted + chapters
  }));

  return (
    <AppContext.Provider value={{ history, addToHistory, bookmarks, addBookmark, removeBookmark, settings, updateSettings, stats, updateStats }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
