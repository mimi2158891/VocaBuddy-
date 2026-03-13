import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVocabulary } from '../context/VocabularyContext';
import { useSpeech } from '../hooks/useSpeech';
import { ACCENTS, ACCENT_LABELS } from '../utils/constants';
import { MdSkipPrevious, MdSkipNext, MdVolumeUp, MdShuffle, MdAutorenew, MdFlip, MdSettingsVoice } from 'react-icons/md';
import './CardStudy.css';

/**
 * AutoScalingWord Component
 * Scales text to fit container width without wrapping or clipping.
 */
const AutoScalingWord = ({ word }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [scale, setScale] = useState(1);

  const handleResize = useCallback(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.offsetWidth;
      if (textWidth > containerWidth) {
        setScale(containerWidth / textWidth);
      } else {
        setScale(1);
      }
    }
  }, []);

  useEffect(() => {
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [word, handleResize]);

  return (
    <div ref={containerRef} className="auto-scale-container" style={{ 
      width: '100%', 
      overflow: 'visible', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <h1 ref={textRef} className="card-word" style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        margin: 0,
        transition: 'transform 0.1s ease-out'
      }}>
        {word}
      </h1>
    </div>
  );
};

/**
 * CardStudy Component
 * Refactored to use VocabularyContext for shared state.
 */
const CardStudy = () => {
  const { vocabulary, folders, loading, fetchVocabulary, updateWord, logStudyEvent } = useVocabulary();
  const { accent, changeAccent, speakWord } = useSpeech();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('All Folders');
  const [frontLanguage, setFrontLanguage] = useState('en');
  const [studyMode, setStudyMode] = useState('browse');
  
  const [sessionResults, setSessionResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStartTime] = useState(Date.now().toString()); // Simple Session ID
  const [isWarmup, setIsWarmup] = useState(false);
  
  // Recall time tracking
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [recallTime, setRecallTime] = useState(null);
  
  const vocabRef = useRef(vocabulary);
  // Vocabulary update effect: Update playlist content without changing order or index
  useEffect(() => {
    setPlaylist(prevPlaylist => {
      if (!prevPlaylist.length) return prevPlaylist;
      return prevPlaylist.map(item => {
        const updated = vocabulary.find(v => v.id === item.id);
        return updated ? { ...updated } : item;
      });
    });
  }, [vocabulary]);

  const rebuildPlaylist = useCallback((resetIndex = true) => {
    if (!vocabulary || vocabulary.length === 0) {
      setPlaylist([]);
      return;
    }
    
    let list = vocabulary.filter(item => {
      const itemFolder = item.folder?.trim() || 'Uncategorized';
      return selectedFolder === 'All Folders' || itemFolder === selectedFolder;
    });

    if (isShuffle) {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    
    setPlaylist(list);
    if (resetIndex) {
      setCurrentIndex(0);
      setSessionResults([]);
      setIsFinished(false);
      setIsFlipped(false);
    }
  }, [vocabulary, selectedFolder, isShuffle, studyMode]);

  // Initial fetch on mount
  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  // Rebuild on mount or when filters/mode change
  useEffect(() => {
    rebuildPlaylist(true);
  }, [selectedFolder, isShuffle, studyMode]); 

  // Handle mode switching
  const handleModeChange = (mode) => {
    setStudyMode(mode);
    setIsFlipped(false);
    if (mode === 'test') {
      setIsWarmup(true);
    } else {
      setIsWarmup(false);
    }
  };

  // Reset timer when index changes or warmup ends
  useEffect(() => {
    if (!isWarmup) {
      setCardStartTime(Date.now());
      setRecallTime(null);
    }
  }, [currentIndex, isWarmup]);

  const handleNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setIsFlipped(false);
      setTimeout(() => setIsFinished(true), 150);
    }
  }, [currentIndex, playlist.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  }, [currentIndex]);

  const toggleFlip = () => {
    if (!isFlipped && recallTime === null) {
      const timeTaken = (Date.now() - cardStartTime) / 1000;
      setRecallTime(timeTaken);
    }
    setIsFlipped(!isFlipped);
  };
  
  const handleReview = (quality) => {
    const currentWord = playlist[currentIndex];
    if (!currentWord) return;

    let interval = currentWord.interval || 0;
    let repetitions = currentWord.repetitions || 0;
    let easeFactor = currentWord.easeFactor || 2.5;
    let nextReviewAt = new Date();
    let status = currentWord.status || "new";

    if (quality === 'Again') {
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2); 
      nextReviewAt.setDate(nextReviewAt.getDate() + interval);
      status = "learning";
    } else if (quality === 'Hard') {
      interval = interval === 0 ? 1 : interval * 1.2;
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      nextReviewAt.setDate(nextReviewAt.getDate() + interval);
    } else if (quality === 'Good') {
      repetitions += 1;
      interval = interval === 0 ? 1 : interval * easeFactor;
      nextReviewAt.setDate(nextReviewAt.getDate() + interval);
      status = "review";
    } else if (quality === 'Easy') {
      repetitions += 1;
      interval = interval === 0 ? 1 : interval * easeFactor * 1.3;
      easeFactor += 0.15;
      nextReviewAt.setDate(nextReviewAt.getDate() + interval);
      status = "review";
    }

    const updatedData = {
      interval,
      repetitions,
      easeFactor,
      nextReviewAt: nextReviewAt.toISOString(),
      lastReviewedAt: new Date().toISOString(),
      status
    };

    // Log the study event
    logStudyEvent({
      session_id: sessionStartTime,
      word_id: currentWord.id,
      rating: quality,
      recall_time: recallTime || (Date.now() - cardStartTime) / 1000,
      timestamp: new Date().toISOString()
    });

    updateWord(currentWord.id, updatedData);
    setSessionResults(prev => [...prev, { ...currentWord, quality }]);
    handleNext();
  };
  
  const handleSpeak = (e) => {
    e.stopPropagation();
    const currentWord = playlist[currentIndex];
    if (currentWord && currentWord.word) {
      speakWord(currentWord.word);
    }
  };

  const currentCard = playlist[currentIndex];
  
  if (loading && vocabulary.length === 0) {
    return (
      <div className="page-container fadeIn">
        <div className="study-container centered">
          <div className="spinner primary-spinner"></div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const againList = sessionResults.filter(r => r.quality === 'Again');
    const hardList = sessionResults.filter(r => r.quality === 'Hard');
    const goodList = sessionResults.filter(r => r.quality === 'Good');
    const easyList = sessionResults.filter(r => r.quality === 'Easy');

    return (
      <div className="page-container fadeIn">
        <div className="study-container centered">
          <div className="summary-card-wrapper fadeIn" style={{ 
            backgroundColor: '#ffffff', 
            padding: '32px', 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
            border: '1px solid var(--border-color)', 
            maxWidth: '700px', 
            width: '100%', 
            margin: '20px auto' 
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--primary-color)', fontSize: '1.8rem' }}>🎉 複習完成！</h2>
            <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>本次共複習了 {sessionResults.length} 個單字</p>
            
            <div className="summary-lists" style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '60vh', padding: '10px 5px' }}>
              {againList.length > 0 && (
                <div className="summary-section">
                  <h3 style={{color: '#ef4444', fontSize: '1.1rem', marginBottom: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>忘記 (Again) - {againList.length}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {againList.map((r, i) => (
                      <span key={i} style={{ 
                        display: 'inline-block', padding: '8px 16px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '500', 
                        color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid rgba(239, 68, 68, 0.15)',
                        textTransform: 'none'
                      }}>
                        {r.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hardList.length > 0 && (
                <div className="summary-section">
                  <h3 style={{color: '#f59e0b', fontSize: '1.1rem', marginBottom: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>困難 (Hard) - {hardList.length}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {hardList.map((r, i) => (
                      <span key={i} style={{ 
                        display: 'inline-block', padding: '8px 16px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '500', 
                        color: '#f59e0b', backgroundColor: '#fef3c7', border: '1px solid rgba(245, 158, 11, 0.15)',
                        textTransform: 'none'
                      }}>
                        {r.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {goodList.length > 0 && (
                <div className="summary-section">
                  <h3 style={{color: '#10b981', fontSize: '1.1rem', marginBottom: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>普通 (Normal) - {goodList.length}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {goodList.map((r, i) => (
                      <span key={i} style={{ 
                        display: 'inline-block', padding: '8px 16px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '500', 
                        color: '#10b981', backgroundColor: '#d1fae5', border: '1px solid rgba(16, 185, 129, 0.15)',
                        textTransform: 'none'
                      }}>
                        {r.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {easyList.length > 0 && (
                <div className="summary-section">
                  <h3 style={{color: '#3b82f6', fontSize: '1.1rem', marginBottom: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>簡單 (Easy) - {easyList.length}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {easyList.map((r, i) => (
                      <span key={i} style={{ 
                        display: 'inline-block', padding: '8px 16px', borderRadius: '8px', fontSize: '1.05rem', fontWeight: '500', 
                        color: '#3b82f6', backgroundColor: '#dbeafe', border: '1px solid rgba(59, 130, 246, 0.15)',
                        textTransform: 'none'
                      }}>
                        {r.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <button className="primary-btn" onClick={() => rebuildPlaylist()} style={{ width: '100%', maxWidth: '300px' }}>
                完成 / 開始新一輪
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className="page-container fadeIn">
        <header className="page-header">
           <h2>卡片學習模式</h2>
           <p>全部複習完畢！</p>
        </header>
        <div className="study-container centered">
          <div style={{ textAlign: 'center', backgroundColor: 'var(--surface-color)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ marginBottom: '16px', color: 'var(--success-color, #10b981)' }}>🎉 全部複習完畢！</h2>
            <p style={{ color: 'var(--text-secondary)' }}>太棒了，目前沒有需要複習的單字了。</p>
          </div>
        </div>
      </div>
    );
  }

  const renderHeader = () => (
    <header className="page-header">
      <div>
        <h2>卡片學習模式</h2>
        <p>點擊卡片翻面，挑戰你的記憶力。</p>
      </div>
      
      <div className="mode-pill-toggle">
        <button className={`pill-btn ${studyMode === 'browse' ? 'active' : ''}`} onClick={() => handleModeChange('browse')}>
           閱讀模式
        </button>
        <button className={`pill-btn ${studyMode === 'test' ? 'active' : ''}`} onClick={() => handleModeChange('test')}>
           記憶測試
        </button>
      </div>
    </header>
  );

  return (
    <div className="page-container fixed-study-page fadeIn">
      {renderHeader()}

      <div className="study-toolbar">
        <div className="playback-controls-group">
          <div className="order-toggle">
            <button onClick={() => setIsShuffle(false)} className={`order-btn ${!isShuffle ? 'active' : ''}`}>
              <MdAutorenew size={18} /> 順序
            </button>
            <button onClick={() => setIsShuffle(true)} className={`order-btn ${isShuffle ? 'active' : ''}`}>
              <MdShuffle size={18} /> 隨機
            </button>
          </div>
        </div>

        <div className="settings-divider"></div>

        <div className="inline-setting">
          <MdSettingsVoice size={20} className="setting-icon" />
          <select value={accent} onChange={(e) => changeAccent(e.target.value)} className="inline-select">
            {Object.entries(ACCENT_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        <div className="inline-setting language-setting">
          <select value={frontLanguage} onChange={(e) => setFrontLanguage(e.target.value)} className="inline-select">
            <option value="en">顯示英文</option>
            <option value="zh">顯示中文</option>
          </select>
        </div>

        <div className="inline-setting">
          <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className="inline-select">
            <option value="All Folders">📁 All Folders</option>
            {folders.map(f => <option key={f} value={f}>📂 {f}</option>)}
          </select>
        </div>
      </div>

      <div className="horizontal-divider"></div>

      <div className="study-container">
        {isWarmup ? (
          <div className="warmup-card fadeIn shadow-premium" style={{
            backgroundColor: 'var(--surface-color)',
            padding: '40px 32px',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            textAlign: 'center',
            maxWidth: '460px',
            width: '90%',
            margin: '60px auto',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div className="badge-test-mode" style={{
              backgroundColor: 'rgba(79, 70, 229, 0.08)',
              color: 'var(--primary-color)',
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}>
              Test Mode
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
              記憶測試即將開始
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1rem', lineHeight: '1.6', maxWidth: '300px' }}>
              準備好測試你的記憶力了嗎？<br/>即將顯示單字，請儘快回想。
            </p>
            <button className="primary-btn" onClick={() => setIsWarmup(false)} style={{ 
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              padding: '14px 40px', 
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '14px',
              width: '100%',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}>
              開始測試
            </button>
          </div>
        ) : (
          <>
            <div className="study-progress">{currentIndex + 1} / {playlist.length}</div>

            <div className="flashcard-wrapper" onClick={toggleFlip}>
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <div className="card-front">
                  {frontLanguage === 'en' ? (
                    <>
                      <span className="card-label">English</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', width: '100%' }}>
                        <AutoScalingWord word={currentCard?.word} />
                        <button className="audio-btn" onClick={handleSpeak} style={{ flexShrink: 0 }}><MdVolumeUp size={24} /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="card-label">Meaning</span>
                      <h2 className="card-chinese">{currentCard?.chinese}</h2>
                    </>
                  )}
                </div>

                <div className="card-back">
                  {frontLanguage === 'en' ? (
                    <>
                      <span className="card-label">Meaning</span>
                      <h2 className="card-chinese">{currentCard?.chinese}</h2>
                      {currentCard?.example && <p className="card-example">"{currentCard.example}"</p>}
                    </>
                  ) : (
                    <>
                      <span className="card-label">English</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px', width: '100%' }}>
                        <AutoScalingWord word={currentCard?.word} />
                        <button className="audio-btn" onClick={handleSpeak} style={{ flexShrink: 0 }}><MdVolumeUp size={24} /></button>
                      </div>
                      {currentCard?.example && <p className="card-example">"{currentCard.example}"</p>}
                    </>
                  )}
                  
                  {studyMode === 'test' && (
                    <div className="srs-controls" onClick={e => e.stopPropagation()}>
                      <button className="srs-btn again" onClick={() => handleReview('Again')}>忘記</button>
                      <button className="srs-btn hard" onClick={() => handleReview('Hard')}>困難</button>
                      <button className="srs-btn good" onClick={() => handleReview('Good')}>普通</button>
                      <button className="srs-btn easy" onClick={() => handleReview('Easy')}>簡單</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="study-controls">
              <button className="control-btn" onClick={handlePrev} disabled={currentIndex === 0}><MdSkipPrevious size={30} /></button>
              <button className="control-btn primary" onClick={toggleFlip}><MdFlip size={36} /></button>
              <button className="control-btn" onClick={handleNext} disabled={currentIndex === playlist.length - 1}><MdSkipNext size={30} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CardStudy;
