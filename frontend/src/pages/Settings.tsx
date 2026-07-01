import React from 'react';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useAppContext();

  return (
    <div className="animate-in">
      <header className="mb-12">
        <h1 className="heading-lg">Settings</h1>
        <p className="text-muted" style={{ fontSize: '1.2rem' }}>Customize your listening experience.</p>
      </header>

      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <div className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="stat-label">Playback Speed</label>
          <select 
            className="input-text"
            value={settings.playbackSpeed} 
            onChange={(e) => updateSettings({ playbackSpeed: parseFloat(e.target.value) })}
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x (Normal)</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>
        </div>

        <div className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="stat-label">Auto-Next Chapter</label>
          <select 
            className="input-text"
            value={settings.autoNextChapter ? 'true' : 'false'} 
            onChange={(e) => updateSettings({ autoNextChapter: e.target.value === 'true' })}
          >
            <option value="true">Enabled (Continuous Playback)</option>
            <option value="false">Disabled (Stop after chapter)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
