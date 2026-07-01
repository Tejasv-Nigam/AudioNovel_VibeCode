import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const { stats, history, addToHistory } = useAppContext();

  const navigate = useNavigate();

  const handleStartReading = () => {
    if (url) {
      addToHistory(url);
      navigate(`/player?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <div className="animate-in">
      <header className="mb-12">
        <h1 className="heading-lg">Welcome back.</h1>
        <p className="text-muted" style={{ fontSize: '1.2rem' }}>Ready to dive into your next adventure?</p>
      </header>

      <div className="glass-panel mb-12">
        <h2 style={{ marginBottom: '16px' }}>Start a new journey</h2>
        <div className="input-group">
          <input 
            type="text" 
            className="input-text" 
            placeholder="Paste web novel chapter URL here..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="btn-primary" onClick={handleStartReading}>
            <Play fill="currentColor" size={20} />
            Start Reading
          </button>
        </div>
      </div>

      <div className="grid-stats mb-12">
        <div className="glass-panel stat-card">
          <div className="stat-label">Listening Time</div>
          <div className="stat-value">{stats.hoursListened.toFixed(1)} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>hrs</span></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">Chapters Completed</div>
          <div className="stat-value">{stats.chaptersCompleted}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">Stories Read</div>
          <div className="stat-value">{history.length}</div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px' }}>Continue Reading</h2>
          <div className="nav-links">
            {history.slice(0, 3).map((h, i) => (
              <a key={i} href="#" className="nav-item" style={{ background: 'var(--bg-surface)' }}>
                {h}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
