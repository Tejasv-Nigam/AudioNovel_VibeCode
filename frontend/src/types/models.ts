export interface Book {
  id: string; // usually URL or domain+path
  title: string;
  author?: string;
  coverUrl?: string;
}

export interface Chapter {
  id: string; // url
  bookId?: string;
  title: string;
  content: string; // original raw text
  nextChapterUrl: string | null;
  prevChapterUrl?: string | null;
  wordCount?: number;
}

export interface TtsChunk {
  index: number;
  text: string;
  sentences: { text: string; globalIndex: number }[];
}

export interface ExtractorResult {
  title: string;
  content: string;
  nextChapterUrl: string | null;
  originalUrl: string;
  bookTitle?: string;
  author?: string;
}

export interface PlaybackSession {
  id: string; // e.g. "current"
  chapterUrl: string;
  chapterTitle: string;
  progressPercent: number;
  lastUpdated: number; // timestamp
}

export interface HistoryItem {
  url: string;
  title: string;
  bookTitle?: string;
  progressPercent: number;
  lastOpened: number; // timestamp
}

export interface Bookmark {
  url: string;
  title: string;
  bookTitle?: string;
  dateAdded: number; // timestamp
}

export interface LibraryItem {
  bookId: string;
  title: string;
  author?: string;
  coverUrl?: string;
  lastReadChapterUrl: string;
  progressPercent: number; 
  dateAdded: number;
}
