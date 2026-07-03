import React from 'react';

interface TextRendererProps {
  sentences: string[];
  activeIndex: number;
}

export const TextRenderer = React.memo(({ sentences, activeIndex }: TextRendererProps) => {
  return (
    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
      {sentences.map((sentence, idx) => (
        <span key={idx} className={idx === activeIndex ? 'highlight-active' : ''}>
          {sentence}{' '}
        </span>
      ))}
    </div>
  );
});
