import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import { useSpeech } from '../hooks/useSpeech';
import { ACCENTS, ACCENT_LABELS } from '../utils/constants';
import { MdSkipPrevious, MdSkipNext, MdVolumeUp, MdShuffle, MdAutorenew, MdFlip, MdSettingsVoice, MdLibraryBooks, MdAssignment } from 'react-icons/md';
import './CardStudy.css';

const CardStudy = () => {
  const { vocabulary, folders, loading, fetchVocabulary, updateWord } = useVocabulary();
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
  
  const vocabRef = useRef(vocabulary);
  const prevVocabLength = useRef(0);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  useEffect(() => {
    vocabRef.current = vocabulary;
  }, [vocabulary]);

  const rebuildPlaylist = useCallback(() => {
    const vocab = vocabRef.current;
    if (!vocab || vocab.length === 0) {
      setPlaylist([]);
      return;
    }
    let list = vocab.filter(item => {
      const itemFolder = item.folder?.trim() || 'Uncategorized';
      const folderMatch = selectedFolder === 'All Folders' || itemFolder === selectedFolder;
      
      const now = new Date();
      const nextReviewAt = item.nextReviewAt ? new Date(item.nextReviewAt) : null;
      const isDue = !nextReviewAt || nextReviewAt <= now;
      
      return folderMatch && isDue;
    });
    if (isShuffle) {
      list.sort(() => Math.random() - 0.5);
    }
    setPlaylist(list);
    setCurrentIndex(0);
    setSessionResults([]);
    setIsFinished(false);
    setIsFlipped(false);
  }, [selectedFolder, isShuffle, studyMode]);

  // Initial load
  useEffect(() => {
    if (vocabulary.length > 0 && prevVocabLength.current === 0) {
      rebuildPlaylist();
    }
    prevVocabLength.current = vocabulary.length;
  }, [vocabulary.length, rebuildPlaylist]);

  // Rebuild when selectedFolder or isShuffle changes
  useEffect(() => {
    if (prevVocabLength.current > 0) {
      rebuildPlaylist();
    }
  }, [rebuildPlaylist]);

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

  const toggleFlip = () => setIsFlipped(!isFlipped);
  
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
      easeFactor = Math.max(1.3, easeFactor - 0.2); // Minimum ease is 1.3
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

    updateWord(currentWord.id, updatedData);
    
    // Record to results for the summary page
    setSessionResults(prev => [...prev, { ...currentWord, quality }]);
    
    // Proceed to next card after review
    handleNext();
  };
  
  const handleSpeak = (e) => {
    e.stopPropagation();
    const currentWord = playlist[currentIndex];
    if (currentWord && currentWord.word) {
      speakWord(currentWord.word);
    }
  };

  if (loading) {
    return (
      <div className="page-container fadeIn">
        {renderHeader()}
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
        {renderHeader()}
        <div className="study-container centered">
          <div className="summary-card fadeIn" style={{ backgroundColor: 'var(--surface-color)', padding: '30px', margin: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--primary-color)' }}>🎉 複習完成！</h2>
          <p style={{ textAlign: 'center', marginBottom: '25px', color: 'var(--text-secondary)' }}>本次共複習了 {sessionResults.length} 個單字</p>
          
          <div className="summary-lists" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '50vh', padding: '10px 0' }}>
            {againList.length > 0 && (
              <div className="summary-section">
                <h3 style={{color: '#ef4444', fontSize: '1rem', marginBottom: '10px'}}><i className="fas fa-times-circle"></i> 忘記 (Again) - {againList.length}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {againList.map((r, i) => <span key={i} style={{background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500}}>{r.word}</span>)}
                </div>
              </div>
            )}
            {hardList.length > 0 && (
              <div className="summary-section">
                <h3 style={{color: '#f59e0b', fontSize: '1rem', marginBottom: '10px'}}><i className="fas fa-exclamation-circle"></i> 困難 (Hard) - {hardList.length}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {hardList.map((r, i) => <span key={i} style={{background: '#fef3c7', border: '1px solid #fcd34d', color: '#b45309', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500}}>{r.word}</span>)}
                </div>
              </div>
            )}
            {goodList.length > 0 && (
              <div className="summary-section">
                <h3 style={{color: '#10b981', fontSize: '1rem', marginBottom: '10px'}}><i className="fas fa-check-circle"></i> 記得 (Good) - {goodList.length}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {goodList.map((r, i) => <span key={i} style={{background: '#d1fae5', border: '1px solid #6ee7b7', color: '#047857', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500}}>{r.word}</span>)}
                </div>
              </div>
            )}
            {easyList.length > 0 && (
              <div className="summary-section">
                <h3 style={{color: '#3b82f6', fontSize: '1rem', marginBottom: '10px'}}><i className="fas fa-star"></i> 簡單 (Easy) - {easyList.length}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {easyList.map((r, i) => <span key={i} style={{background: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500}}>{r.word}</span>)}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className="primary-btn" 
              onClick={() => {
                rebuildPlaylist();
              }} 
              style={{ width: '100%', maxWidth: '300px', padding: '14px 20px', fontSize: '1rem', fontWeight: 600 }}
            >
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
        {renderHeader()}
        <div className="study-container centered">
          {vocabulary.length > 0 ? (
          <div style={{ textAlign: 'center', backgroundColor: 'var(--surface-color)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ marginBottom: '16px', color: 'var(--success-color, #10b981)' }}>🎉 全部複習完畢！</h2>
            <p style={{ color: 'var(--text-secondary)' }}>太棒了，目前沒有需要複習的單字了，快去喝杯水休息一下吧！</p>
          </div>
        ) : (
          <p>目前沒有單字。請先新增一些單字！</p>
          )}
        </div>
      </div>
    );
  }

  const currentCard = playlist[currentIndex];

  function renderHeader() {
    return (
      <>
        <header className="page-header" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', justifyContent: 'space-between' }}>
          <div>
            <h2>卡片學習模式</h2>
            <p>點擊卡片翻面，挑戰你的記憶力。</p>
          </div>
          
          <div className="mode-pill-toggle" style={{ margin: 0 }}>
            <button 
              className={`pill-btn ${studyMode === 'browse' ? 'active' : ''}`}
              onClick={() => { setStudyMode('browse'); setIsFlipped(false); rebuildPlaylist(); }}
            >
               一般瀏覽
            </button>
            <button 
              className={`pill-btn ${studyMode === 'test' ? 'active' : ''}`}
              onClick={() => { setStudyMode('test'); setIsFlipped(false); rebuildPlaylist(); }}
            >
               記憶測試
            </button>
          </div>
        </header>

        <div className="vocab-controls-panel" style={{ backgroundColor: 'var(--surface-color)', padding: '12px 16px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', width: '100%', margin: '0 auto 24px auto', justifyContent: 'center', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', padding: '4px', gap: '4px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
              <button 
                onClick={() => setIsShuffle(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: !isShuffle ? 'var(--primary-color)' : 'transparent', color: !isShuffle ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                <MdAutorenew size={16} /> 順序
              </button>
              <button 
                onClick={() => setIsShuffle(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: isShuffle ? 'var(--primary-color)' : 'transparent', color: isShuffle ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                <MdShuffle size={16} /> 隨機
              </button>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
          </div>
            <div className="inline-setting">
              <MdSettingsVoice size={20} className="setting-icon" />
              <select 
                value={accent} 
                onChange={(e) => changeAccent(e.target.value)}
                className="inline-select"
              >
                {Object.entries(ACCENT_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            
            <div className="inline-setting">
              <select 
                value={frontLanguage} 
                onChange={(e) => {
                  setFrontLanguage(e.target.value);
                  setIsFlipped(false);
                }}
                className="inline-select"
              >
                <option value="en">顯示英文</option>
                <option value="zh">顯示中文</option>
              </select>
            </div>

            <div className="inline-setting">
              <select 
                value={selectedFolder} 
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="inline-select"
                style={{ maxWidth: '160px', flex: '1 1 auto', textOverflow: 'ellipsis' }}
              >
                <option value="All Folders">📁 All Folders</option>
                {folders.map(f => (
                  <option key={f} value={f}>📂 {f}</option>
                ))}
              </select>
            </div>
        </div>
      </>
    );
  }

  return (
    <div className="page-container fadeIn">
      {renderHeader()}

      <div className="study-container">
        <div className="study-progress">
          {currentIndex + 1} / {playlist.length}
        </div>

        <div className="flashcard-wrapper" onClick={toggleFlip}>
          <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
            {/* Front Side */}
            <div className="card-front">
              {frontLanguage === 'en' ? (
                <>
                  <span className="card-label">English</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <h1 className="card-word">{currentCard?.word}</h1>
                    <button 
                      className="audio-btn" 
                      onClick={handleSpeak} 
                    >
                      <MdVolumeUp size={24} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="card-label">Meaning</span>
                  <h2 className="card-chinese">{currentCard?.chinese}</h2>
                </>
              )}
            </div>

            {/* Back Side */}
            <div className="card-back">
              {frontLanguage === 'en' ? (
                <>
                  <span className="card-label">Meaning</span>
                  <h2 className="card-chinese">{currentCard?.chinese}</h2>
                  {currentCard?.example && (
                    <p className="card-example">"{currentCard.example}"</p>
                  )}
                </>
              ) : (
                <>
                  <span className="card-label">English</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
                    <h1 className="card-word">{currentCard?.word}</h1>
                    <button 
                      className="audio-btn" 
                      onClick={handleSpeak} 
                    >
                      <MdVolumeUp size={24} />
                    </button>
                  </div>
                  {currentCard?.example && (
                    <p className="card-example" style={{ margin: 0, paddingBottom: '10px' }}>"{currentCard.example}"</p>
                  )}
                </>
              )}
              
              {studyMode === 'test' && (
              <div className="srs-controls" onClick={e => e.stopPropagation()}>

                <button className="srs-btn again" onClick={() => handleReview('Again')}>
                  <span className="srs-label">忘記</span>
                  <span className="srs-hint">Again</span>
                </button>
                <button className="srs-btn hard" onClick={() => handleReview('Hard')}>
                  <span className="srs-label">困難</span>
                  <span className="srs-hint">Hard</span>
                </button>
                <button className="srs-btn good" onClick={() => handleReview('Good')}>
                  <span className="srs-label">記得</span>
                  <span className="srs-hint">Good</span>
                </button>
                <button className="srs-btn easy" onClick={() => handleReview('Easy')}>
                  <span className="srs-label">簡單</span>
                  <span className="srs-hint">Easy</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="study-controls">
          <button 
            className="control-btn" 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            title="Previous"
          >
            <MdSkipPrevious size={30} />
          </button>

          <button 
            className="control-btn primary" 
            onClick={toggleFlip}
            title="Flip Card"
          >
            <MdFlip size={36} />
          </button>

          <button 
            className="control-btn" 
            onClick={handleNext} 
            disabled={currentIndex === playlist.length - 1}
            title="Next"
          >
            <MdSkipNext size={30} />
          </button>
        </div>

        <p className="study-hint">提示：點擊卡片或中間的按鈕可以翻面</p>
      </div>
    </div>
  );
};

export default CardStudy;
