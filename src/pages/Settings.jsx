import React from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { useTheme } from '../hooks/useTheme';
import { ACCENTS, ACCENT_LABELS } from '../utils/constants';
import './Settings.css';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { accent, changeAccent, speed, changeSpeed } = useSpeech();

  const speedOptions = [1.0, 1.25, 1.5, 2.0];

  return (
    <div className="page-container fadeIn">
      <header className="page-header">
        <h2>設定 (Settings)</h2>
        <p>個人化你的學習環境與發音偏好。</p>
      </header>

      <div className="settings-grid">
        <section className="settings-section">
          <h3>顯示設定 (Display Preferences)</h3>
          <div className="setting-card">
            <div className="setting-info">
              <h4>主題模式 (Theme Mode)</h4>
              <p>切換深色與淺色外觀。</p>
            </div>
            <div className="setting-control">
              <button 
                className={`theme-toggle-pad ${theme === 'dark' ? 'active' : ''}`}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? '🌙 深色模式 (Dark)' : '🌞 淺色模式 (Light)'}
              </button>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>語音引擎設定 (Speech Engine Preferences)</h3>
          
          <div className="setting-card">
            <div className="setting-info">
              <h4>英文口音 (English Accent)</h4>
              <p>選擇單字朗讀的地區發音。</p>
            </div>
            <div className="setting-control">
              <select 
                value={accent} 
                onChange={(e) => changeAccent(e.target.value)}
                className="setting-select"
              >
                {Object.values(ACCENTS).map(code => (
                  <option key={code} value={code}>
                    {ACCENT_LABELS[code]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-card">
            <div className="setting-info">
              <h4>語速 (Speech Rate)</h4>
              <p>調整語音播放的閱讀速度。</p>
            </div>
            <div className="setting-control segment-control">
              {speedOptions.map(val => (
                <button 
                  key={val}
                  className={`segment-btn ${speed === val ? 'active' : ''}`}
                  onClick={() => changeSpeed(val)}
                >
                  {val.toFixed(2)}x
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
