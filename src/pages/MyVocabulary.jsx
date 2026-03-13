import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVocabulary } from '../context/VocabularyContext';
import { useSpeech } from '../hooks/useSpeech';
import { ACCENTS, ACCENT_LABELS, PLAYBACK_MODES } from '../utils/constants';
import { 
  MdSearch, MdVolumeUp, MdSettingsVoice, MdSpeed, 
  MdPlayCircleOutline, MdEdit, MdDelete, MdCheck, MdClose,
  MdAutorenew, MdShuffle, MdStopCircle
} from 'react-icons/md';
import './MyVocabulary.css';

/**
 * MyVocabulary Component
 * Refactored to use VocabularyContext for shared state across pages.
 */
const MyVocabulary = () => {
  const { 
    vocabulary, 
    folders, 
    loading, 
    error, 
    fetchVocabulary, 
    updateWord, 
    deleteWord, 
    deleteFolder 
  } = useVocabulary();
  
  const { accent, speed, changeAccent, changeSpeed, speakWord } = useSpeech();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All Folders');
  const [playbackMode, setPlaybackMode] = useState(PLAYBACK_MODES.EN_ONLY);
  const [playingId, setPlayingId] = useState(null); 
  
  // Auto-play state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playOrder, setPlayOrder] = useState('sequential'); // 'sequential' or 'random'

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ word: '', chinese: '', example: '' });

  // Delete Modal & Toast State
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [wordToDelete, setWordToDelete] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const speedOptions = [1.0, 1.25, 1.5, 2.0];
  const isAutoPlayingRef = useRef(isAutoPlaying);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  const filteredVocab = vocabulary.filter(item => {
    const itemFolder = item.folder?.trim() || 'Uncategorized';
    const folderMatch = selectedFolder === 'All Folders' || itemFolder === selectedFolder;
    const searchMatch = item.word?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.chinese?.includes(searchTerm);
    return folderMatch && searchMatch;
  });

  // Identify duplicates
  const wordCounts = vocabulary.reduce((acc, item) => {
    const word = item.word?.toLowerCase().trim();
    if (word) acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      word: item.word || '',
      chinese: item.chinese || '',
      example: item.example || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    const success = await updateWord(id, editForm);
    if (success) {
      setEditingId(null);
    }
  };

  const handleDelete = (item) => {
    setWordToDelete(item);
  };

  const confirmDeleteWord = async () => {
    if (!wordToDelete) return;
    const item = wordToDelete;

    if (playingId === item.id) {
      stopCurrentPlay();
    }
    
    setWordToDelete(null);
    const success = await deleteWord(item.id);
    if (success) {
      setSuccessToast('刪除成功！');
      setTimeout(() => setSuccessToast(''), 1000);
    }
  };

  const cancelDeleteWord = () => {
    setWordToDelete(null);
  };

  const handleDeleteFolder = () => {
    if (selectedFolder === 'All Folders') return;
    setFolderToDelete(selectedFolder);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    if (isAutoPlaying) {
      stopCurrentPlay();
      setIsAutoPlaying(false);
    }
    
    const folderName = folderToDelete;
    setFolderToDelete(null);
    setSelectedFolder('All Folders');
    
    const success = await deleteFolder(folderName);
    if (success) {
      setSuccessToast('刪除成功！');
      setTimeout(() => setSuccessToast(''), 1000);
    }
  };

  const cancelDeleteFolder = () => {
    setFolderToDelete(null);
  };

  // Auto-scroll to playing card
  useEffect(() => {
    if (playingId) {
      const element = document.getElementById(`vocab-card-${playingId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingId]);

  const playSessionRef = useRef(0);

  const stopCurrentPlay = () => {
    playSessionRef.current += 1;
    import('../services/speechEngine').then(({ speechEngine }) => {
      speechEngine.stop();
    });
    setPlayingId(null);
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopCurrentPlay();
      setIsAutoPlaying(false);
    } else {
      if (filteredVocab.length === 0) return;
      setIsAutoPlaying(true);
      const startIndex = playOrder === 'random' ? Math.floor(Math.random() * filteredVocab.length) : 0;
      handlePlayCard(filteredVocab[startIndex], startIndex, true);
    }
  };

  const handlePlayCard = (item, currentIndexInList = -1, isAutoNext = false) => {
    if (!isAutoNext && isAutoPlaying) {
      setIsAutoPlaying(false);
    }

    if (playingId === item.id && !isAutoNext) {
      stopCurrentPlay();
      return;
    }
    
    stopCurrentPlay();
    const currentSessionId = playSessionRef.current;
    setPlayingId(item.id);
    
    const playSequence = () => {
      let sequence = [];
      
      switch (playbackMode) {
        case PLAYBACK_MODES.EN_ONLY:
          sequence = [{ text: item.word, isChinese: false }];
          break;
        case PLAYBACK_MODES.EN_ZH:
          sequence = [
            { text: item.word, isChinese: false },
            { text: item.chinese, isChinese: true }
          ];
          break;
        case PLAYBACK_MODES.EX_ONLY:
          sequence = [{ text: item.example || "暫無例句", isChinese: false }];
          break;
        case PLAYBACK_MODES.ALL:
          sequence = [
            { text: item.word, isChinese: false },
            { text: item.chinese, isChinese: true },
            { text: item.example, isChinese: false }
          ];
          break;
        default:
          sequence = [{ text: item.word, isChinese: false }];
      }

      sequence = sequence.filter(s => s.text && s.text.trim() !== '');
      if (sequence.length === 0) {
        setPlayingId(null);
        return;
      }

      let currentIndex = 0;

      const playNextCardIfAuto = () => {
        if (playSessionRef.current !== currentSessionId) return;
        if (!isAutoPlayingRef.current) return;
        
        let nextIndex;
        if (playOrder === 'random') {
          if (filteredVocab.length > 1) {
            let candidate;
            do {
              candidate = Math.floor(Math.random() * filteredVocab.length);
            } while (candidate === currentIndexInList);
            nextIndex = candidate;
          } else {
             nextIndex = 0;
          }
        } else {
          let idx = currentIndexInList;
          if (idx === -1) {
            idx = filteredVocab.findIndex(v => v.id === item.id);
          }
          nextIndex = idx + 1;
          if (nextIndex >= filteredVocab.length) {
             setIsAutoPlaying(false);
             return;
          }
        }
        
        setTimeout(() => {
          if (playSessionRef.current !== currentSessionId) return;
          handlePlayCard(filteredVocab[nextIndex], nextIndex, true);
        }, 2500);
      };

      const playNext = () => {
        if (playSessionRef.current !== currentSessionId) return;

        if (currentIndex >= sequence.length) {
          playNextCardIfAuto();
          return;
        }

        const currentItem = sequence[currentIndex];
        currentIndex++;

        let endFired = false;
        
        const handleEnd = () => {
          if (endFired || playSessionRef.current !== currentSessionId) return;
          endFired = true;
          setTimeout(playNext, 100);
        };

        const timePerChar = currentItem.isChinese ? 300 : 100;
        const baseDelay = currentItem.isChinese ? 2000 : 1000;
        const estimatedDuration = (currentItem.text.length * timePerChar) / speed + baseDelay;
        
        const fallbackTimer = setTimeout(() => {
          if (!endFired && playSessionRef.current === currentSessionId) {
             handleEnd();
          }
        }, estimatedDuration + 1000);

        const onEndWrapper = () => {
          clearTimeout(fallbackTimer);
          handleEnd();
        };

        import('../services/speechEngine').then(({ speechEngine }) => {
            if (playSessionRef.current !== currentSessionId) {
              clearTimeout(fallbackTimer);
              return;
            }
            speechEngine.speak(currentItem.text, { 
              accent: currentItem.isChinese ? null : accent, 
              rate: speed, 
              isChinese: currentItem.isChinese, 
              onEnd: onEndWrapper 
            });
        });
      };

      playNext();
    };

    playSequence();
  };

  return (
    <div className="page-container fadeIn">
      <header className="page-header">
        <h2>我的單字庫</h2>
        <p>複習並搜尋你所有儲存的單字。</p>
      </header>

      <div className="vocab-controls-panel" onClick={(e) => e.stopPropagation()}>
        <div className="top-filter-bar" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '0 0 240px' }}>
            <MdSearch size={22} className="search-icon" />
            <input 
              type="text" 
              placeholder="搜尋英文或中文..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="folder-filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <select 
              value={selectedFolder} 
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="inline-select"
              style={{flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: '12px', fontSize: '1rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)'}}
            >
              <option value="All Folders">📁 所有資料夾</option>
              {folders.map(f => (
                <option key={f} value={f}>📂 {f}</option>
              ))}
            </select>
            
            <div className="vocab-stats" style={{ padding: '10px 16px', margin: 0 }}>
              <span>
                {selectedFolder === 'All Folders' 
                  ? `全部: ${filteredVocab.length} 個單字` 
                  : `單字數量: ${filteredVocab.length}`}
              </span>
            </div>
            
            {selectedFolder !== 'All Folders' && (
              <button 
                className="action-btn delete-folder-btn" 
                onClick={handleDeleteFolder}
                title={`Delete all words in ${selectedFolder}`}
                style={{ 
                  backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid currentColor', 
                  padding: '8px 16px', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer', 
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <MdDelete size={18} /> 刪除資料夾
              </button>
            )}
          </div>
        </div>
        
        <div className="audio-settings-bar">
          <div className="playback-controls-group">
            <button 
              className={`auto-play-btn ${isAutoPlaying ? 'active' : ''}`}
              onClick={toggleAutoPlay}
              disabled={filteredVocab.length === 0}
            >
              {isAutoPlaying ? (
                <><MdStopCircle size={20} /> 停止播放</>
              ) : (
                <><MdPlayCircleOutline size={20} /> 播放全部</>
              )}
            </button>

            <div className="inline-setting order-toggle">
              <button 
                className={`order-btn ${playOrder === 'sequential' ? 'active' : ''}`}
                onClick={() => setPlayOrder('sequential')}
              >
                <MdAutorenew size={18} /> 順序
              </button>
              <button 
                className={`order-btn ${playOrder === 'random' ? 'active' : ''}`}
                onClick={() => setPlayOrder('random')}
              >
                <MdShuffle size={18} /> 隨機
              </button>
            </div>
          </div>

          <div className="settings-divider"></div>

          <div className="inline-setting">
            <MdPlayCircleOutline size={20} className="setting-icon"/>
            <select value={playbackMode} onChange={(e) => setPlaybackMode(e.target.value)} className="inline-select">
              <option value={PLAYBACK_MODES.EN_ONLY}>只讀英文</option>
              <option value={PLAYBACK_MODES.EN_ZH}>先英文後中文</option>
              <option value={PLAYBACK_MODES.ALL}>全部 (單字/中文/例句)</option>
              <option value={PLAYBACK_MODES.EX_ONLY}>只讀例句</option>
            </select>
          </div>

          <div className="inline-setting">
            <MdSettingsVoice size={20} className="setting-icon"/>
            <select value={accent} onChange={(e) => changeAccent(e.target.value)} className="inline-select">
              {Object.values(ACCENTS).map(code => (
                <option key={code} value={code}>{ACCENT_LABELS[code]}</option>
              ))}
            </select>
          </div>

          <div className="inline-setting">
            <MdSpeed size={20} className="setting-icon"/>
            <select value={speed} onChange={(e) => changeSpeed(parseFloat(e.target.value))} className="inline-select">
              {speedOptions.map(val => (
                <option key={val} value={val}>{val.toFixed(2)}x</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading && vocabulary.length === 0 ? (
        <div className="loading-state">
          <div className="spinner primary-spinner"></div>
          <p>正在載入你的單字庫...</p>
        </div>
      ) : (
        <div className="vocab-grid-container">
          <div className="vocab-grid">
          {filteredVocab.length > 0 ? (
            filteredVocab.map((item) => (
              <div 
                key={item.id} 
                id={`vocab-card-${item.id}`}
                className={`vocab-card ${playingId === item.id ? 'playing' : ''} ${editingId === item.id ? 'editing' : ''}`}
              >
                {editingId === item.id ? (
                  <div className="edit-form" onClick={(e) => e.stopPropagation()}>
                    <input className="edit-input word" value={editForm.word} onChange={(e) => setEditForm({ ...editForm, word: e.target.value })} placeholder="Word" />
                    <input className="edit-input chinese" value={editForm.chinese} onChange={(e) => setEditForm({ ...editForm, chinese: e.target.value })} placeholder="Chinese Meaning" />
                    <textarea className="edit-input example" value={editForm.example} onChange={(e) => setEditForm({ ...editForm, example: e.target.value })} placeholder="Example sentence" />
                    <div className="edit-actions">
                      <button className="action-btn save" onClick={(e) => { e.stopPropagation(); handleSaveEdit(item.id); }}>
                        <MdCheck size={20} /> 儲存
                      </button>
                      <button className="action-btn cancel" onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}>
                        <MdClose size={20} /> 取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="vocab-card-header">
                      <h3 className="vocab-word">{item.word}</h3>
                      <div className="card-actions-top">
                        <button className={`play-btn-small ${playingId === item.id ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handlePlayCard(item); }}>
                          <MdVolumeUp size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="vocab-chinese">{item.chinese || <span className="empty-field">暫無中文解釋</span>}</div>
                    {item.example && <div className="vocab-example">"{item.example}"</div>}
                    <div className="vocab-meta">
                      <div className="card-actions-bottom">
                        <button className="card-action-icon edit" onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}><MdEdit size={18} /></button>
                        <button className="card-action-icon delete" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}><MdDelete size={18} /></button>
                      </div>
                      <div className="card-badges">
                        <span className="status-badge">📁 {item.folder || 'Uncategorized'}</span>
                        {wordCounts[item.word?.toLowerCase().trim()] > 1 && <span className="status-badge duplicate">Duplicate</span>}
                        <span className={`status-badge ${item.status || 'new'}`}>{item.status || 'new'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state"><p>找不到符合條件的單字。</p></div>
          )}
          </div>
        </div>
      )}

      {wordToDelete && createPortal(
        <div className="modal-overlay" onClick={cancelDeleteWord}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning"><MdDelete size={32} /></div>
            <h3>確認刪除單字</h3>
            <p>即將刪除 <strong>{wordToDelete.word}</strong>。<br/>刪除後將無法復原，是否確認刪除？</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelDeleteWord}>取消</button>
              <button className="btn-danger" onClick={confirmDeleteWord} disabled={loading}>
                {loading ? <span className="spinner-small" /> : '確認刪除'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {folderToDelete && createPortal(
        <div className="modal-overlay" onClick={cancelDeleteFolder}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning"><MdDelete size={32} /></div>
            <h3>確認刪除資料夾</h3>
            <p>即將刪除 <strong>{folderToDelete}</strong>。<br/>刪除後將無法復原，是否確認刪除？</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelDeleteFolder}>取消</button>
              <button className="btn-danger" onClick={confirmDeleteFolder} disabled={loading}>
                {loading ? <span className="spinner-small" /> : '確認刪除'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {successToast && createPortal(
        <div className="modal-overlay">
          <div className="modal-content delete-modal" style={{ textAlign: 'center' }}>
            <div className="modal-icon success" style={{ backgroundColor: '#d1fae5', color: '#10b981', margin: '0 auto 15px auto', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCheck size={40} />
            </div>
            <h3>{successToast}</h3>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyVocabulary;
