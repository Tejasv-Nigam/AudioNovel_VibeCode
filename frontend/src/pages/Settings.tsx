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
          <label className="stat-label">Voice Selection</label>
          <select 
            className="input-text"
            value={settings.voice} 
            onChange={(e) => updateSettings({ voice: e.target.value })}
          >
            <option value="male">Male (en-GB)</option>
            <option value="female">Female (en-US)</option>
            <option value="default">Default</option>
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
