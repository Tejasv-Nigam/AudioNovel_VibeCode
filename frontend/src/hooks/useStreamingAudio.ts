import { useState, useEffect, useRef } from 'react';

export interface Chunk {
  index: number;
  text: string;
  sentences: { text: string; globalIndex: number }[];
}

interface UseStreamingAudioProps {
  chapter: { title: string; content: string; nextChapterUrl: string | null } | null;
  voice: string;
  playbackSpeed: number;
  initialProgressPercent?: number;
  onChapterEnd: () => void;
}

export const useStreamingAudio = ({ chapter, voice, playbackSpeed, initialProgressPercent, onChapterEnd }: UseStreamingAudioProps) => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const abortControllers = useRef<Record<number, AbortController>>({});
  
  const [activeAudio, setActiveAudio] = useState<'A'|'B'>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const [progressPercent, setProgressPercent] = useState(initialProgressPercent || 0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);

  const initialSeekPending = useRef(!!initialProgressPercent && initialProgressPercent > 0);

  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  // 1. Build Chunks when chapter changes
  useEffect(() => {
    if (!chapter) {
      setChunks([]);
      return;
    }
    
    const sentences = chapter.content.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map(s => s.trim()) || [chapter.content];
    
    const newChunks: Chunk[] = [];
    let currentChunkText = '';
    let currentChunkSentences: { text: string; globalIndex: number }[] = [];
    
    sentences.forEach((sentence, idx) => {
      if (currentChunkText.length + sentence.length > 1000 && currentChunkText.length > 0) {
        newChunks.push({
          index: newChunks.length,
          text: currentChunkText,
          sentences: currentChunkSentences
        });
        currentChunkText = '';
        currentChunkSentences = [];
      }
      currentChunkText += (currentChunkText ? ' ' : '') + sentence;
      currentChunkSentences.push({ text: sentence, globalIndex: idx });
    });

    if (currentChunkText.length > 0) {
      newChunks.push({
        index: newChunks.length,
        text: currentChunkText,
        sentences: currentChunkSentences
      });
    }
    
    setChunks(newChunks);
    
    let targetChunk = 0;
    if (initialProgressPercent && initialProgressPercent > 0) {
      const targetChar = (initialProgressPercent / 100) * chapter.content.length;
      let charSum = 0;
      for (let i = 0; i < newChunks.length; i++) {
        if (charSum + newChunks[i].text.length >= targetChar) {
          targetChunk = i;
          break;
        }
        charSum += newChunks[i].text.length;
      }
    }
    
    setCurrentChunkIndex(targetChunk);
    setAudioCache({});
    setActiveSentenceIndex(0);
    setProgressPercent(initialProgressPercent || 0);
    setIsBuffering(true);
    initialSeekPending.current = !!(initialProgressPercent && initialProgressPercent > 0);
    
    // Revoke old blobs
    Object.values(audioCache).forEach(url => URL.revokeObjectURL(url));
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, voice]); // voice change regenerates audio

  // 2. Preload Engine
  const preloadChunk = async (index: number) => {
    if (index >= chunks.length || index < 0) return;
    
    // Check if already cached or fetching
    setAudioCache(prev => {
      if (prev[index]) return prev;
      if (abortControllers.current[index]) return prev;
      
      const controller = new AbortController();
      abortControllers.current[index] = controller;
      
      fetch('http://localhost:3000/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunks[index].text, voice }),
        signal: controller.signal
      })
      .then(res => {
        if (!res.ok) throw new Error('TTS Failed');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setAudioCache(current => ({ ...current, [index]: url }));
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to preload chunk", index, err);
        }
      })
      .finally(() => {
        delete abortControllers.current[index];
      });
      
      return prev;
    });
  };

  useEffect(() => {
    if (chunks.length > 0) {
      preloadChunk(currentChunkIndex);
      preloadChunk(currentChunkIndex + 1); // Preload next
    }
  }, [currentChunkIndex, chunks]);

  // 3. Ping-Pong Playback logic
  useEffect(() => {
    if (chunks.length === 0) return;
    
    const url = audioCache[currentChunkIndex];
    const audioEl = activeAudio === 'A' ? audioRefA.current : audioRefB.current;
    
    if (url && audioEl) {
      setIsBuffering(false);
      if (audioEl.src !== url) {
        audioEl.src = url;
        audioEl.playbackRate = playbackSpeed;
        
        audioEl.onloadedmetadata = () => {
          if (initialSeekPending.current && chapter) {
            const targetChar = (initialProgressPercent! / 100) * chapter.content.length;
            let charsBefore = 0;
            for (let i = 0; i < currentChunkIndex; i++) { charsBefore += chunks[i].text.length; }
            const chunkPercent = (targetChar - charsBefore) / chunks[currentChunkIndex].text.length;
            audioEl.currentTime = chunkPercent * audioEl.duration;
            initialSeekPending.current = false;
          }
          if (isPlaying) {
            audioEl.play().catch(e => console.error("Play error:", e));
          }
        };
      }
    } else {
      setIsBuffering(true);
    }
  }, [currentChunkIndex, audioCache, activeAudio]);

  // Update speed
  useEffect(() => {
    if (audioRefA.current) audioRefA.current.playbackRate = playbackSpeed;
    if (audioRefB.current) audioRefB.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const togglePlay = () => {
    const audioEl = activeAudio === 'A' ? audioRefA.current : audioRefB.current;
    if (!audioEl || isBuffering) return;
    
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play().catch(e => console.error(e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    if (currentChunkIndex + 1 < chunks.length) {
      setActiveAudio(prev => prev === 'A' ? 'B' : 'A');
      setCurrentChunkIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      onChapterEnd();
    }
  };

  const handleTimeUpdate = () => {
    const audioEl = activeAudio === 'A' ? audioRefA.current : audioRefB.current;
    if (!audioEl || chunks.length === 0 || !chapter) return;

    const chunk = chunks[currentChunkIndex];
    if (!chunk) return;

    const currentDuration = audioEl.duration || 0.1;
    const currentProgress = audioEl.currentTime;

    // Highlight Sync
    const chunkPercent = currentProgress / currentDuration;
    const activeChunkCharIndex = chunkPercent * chunk.text.length;

    let charSum = 0;
    let foundGlobalIndex = chunk.sentences[0]?.globalIndex || 0;
    
    for (let i = 0; i < chunk.sentences.length; i++) {
      charSum += chunk.sentences[i].text.length + 1;
      if (charSum >= activeChunkCharIndex) {
        foundGlobalIndex = chunk.sentences[i].globalIndex;
        break;
      }
      foundGlobalIndex = chunk.sentences[i].globalIndex; // default to last if over
    }
    
    setActiveSentenceIndex(foundGlobalIndex);

    // Progress Bar Sync
    let charsBefore = 0;
    for (let i = 0; i < currentChunkIndex; i++) {
      charsBefore += chunks[i].text.length;
    }
    
    const totalChars = chapter.content.length;
    const overallPercent = ((charsBefore + (chunkPercent * chunk.text.length)) / totalChars) * 100;
    
    setProgressPercent(Math.min(100, Math.max(0, overallPercent)));
  };

  const handleSeek = (percent: number) => {
    if (!chapter || chunks.length === 0) return;
    
    const targetChar = (percent / 100) * chapter.content.length;
    
    let charSum = 0;
    for (let i = 0; i < chunks.length; i++) {
       const chunkLen = chunks[i].text.length;
       if (charSum + chunkLen >= targetChar) {
          const chunkPercent = (targetChar - charSum) / chunkLen;
          
          if (i !== currentChunkIndex) {
             setCurrentChunkIndex(i);
             setProgressPercent(percent);
          } else {
             const audioEl = activeAudio === 'A' ? audioRefA.current : audioRefB.current;
             if (audioEl && audioEl.duration) {
               audioEl.currentTime = chunkPercent * audioEl.duration;
             }
          }
          return;
       }
       charSum += chunkLen;
    }
  };

  const handleSkip = (seconds: number) => {
     const audioEl = activeAudio === 'A' ? audioRefA.current : audioRefB.current;
     if (audioEl) {
       audioEl.currentTime += seconds;
     }
  };

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllers.current).forEach(c => c.abort());
    };
  }, []);

  return {
    audioRefA,
    audioRefB,
    activeAudio,
    isPlaying,
    isBuffering,
    progressPercent,
    activeSentenceIndex,
    sentences: chunks.flatMap(c => c.sentences.map(s => s.text)),
    togglePlay,
    handleEnded,
    handleTimeUpdate,
    handleSeek,
    handleSkip,
  };
};
