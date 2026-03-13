import React, { useState } from 'react';
import { useVocabulary } from '../context/VocabularyContext';
import { MdAdd, MdCheckCircle, MdError } from 'react-icons/md';
import './AddWord.css';

/**
 * AddWord Component
 * Refactored to use VocabularyContext and await API response for non-optimistic UI.
 */
const AddWord = () => {
  const { addWord, loading, error, folders } = useVocabulary();
  const [successMsg, setSuccessMsg] = useState('');
  const [isNewFolder, setIsNewFolder] = useState(false);
  
  const [formData, setFormData] = useState({
    word: '',
    chinese: '',
    example: '',
    folder: 'Uncategorized'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'folderSelect') {
      if (value === '+new') {
        setIsNewFolder(true);
        setFormData(prev => ({ ...prev, folder: '' }));
      } else {
        setFormData(prev => ({ ...prev, folder: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.word.trim() || loading) return;

    setSuccessMsg('');
    const currentWord = formData.word;
    
    // Prepare final data
    const finalData = { ...formData };
    if (!finalData.folder.trim()) {
      finalData.folder = 'Uncategorized';
    }
    
    // Task 4: Await the addWord call for non-optimistic update
    const success = await addWord(finalData);
    
    if (success) {
      setSuccessMsg(`"${currentWord}" has been added successfully!`);
      // Reset form on success
      setFormData(prev => ({ 
        ...prev, 
        word: '', 
        chinese: '', 
        example: '', 
        folder: isNewFolder ? 'Uncategorized' : prev.folder 
      }));
      if (isNewFolder) setIsNewFolder(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  return (
    <div className="page-container fadeIn">
      <header className="page-header">
        <h2>新增單字</h2>
        <p>手動輸入新單字至你的個人單字庫。</p>
      </header>

      <div className="form-card">
        {error && (
          <div className="alert error">
            <MdError size={20} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert success">
            <MdCheckCircle size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-word-form">
          <div className="form-group">
            <label htmlFor="word">英文單字 <span className="required">*</span></label>
            <input
              type="text"
              id="word"
              name="word"
              value={formData.word}
              onChange={handleChange}
              placeholder="例如：ubiquitous"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="folder">資料夾 (分類)</label>
            {isNewFolder ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  id="folder"
                  name="folder"
                  value={formData.folder}
                  onChange={handleChange}
                  placeholder="輸入新資料夾名稱..."
                  autoFocus
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <button 
                  type="button" 
                  onClick={() => { setIsNewFolder(false); setFormData(prev => ({ ...prev, folder: 'Uncategorized' })); }}
                  style={{ padding: '0 15px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-color)', cursor: 'pointer' }}
                  disabled={loading}
                >
                  取消
                </button>
              </div>
            ) : (
              <select
                id="folderSelect"
                name="folderSelect"
                value={folders.includes(formData.folder) || formData.folder === 'Uncategorized' ? formData.folder : '+new'}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)', fontSize: '1rem' }}
                disabled={loading}
              >
                <option value="Uncategorized">📁 未分類 (預設)</option>
                {folders.filter(f => f !== 'Uncategorized').map(f => (
                  <option key={f} value={f}>📂 {f}</option>
                ))}
                <option value="" disabled>──────────</option>
                <option value="+new">➕ 建立新資料夾...</option>
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="chinese">中文解釋</label>
            <input
              type="text"
              id="chinese"
              name="chinese"
              value={formData.chinese}
              onChange={handleChange}
              placeholder="例如：無所不在的"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="example">例句</label>
            <textarea
              id="example"
              name="example"
              value={formData.example}
              onChange={handleChange}
              placeholder="His ubiquitous influence was felt by all the family."
              rows={3}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || !formData.word.trim()}
          >
            {loading ? <span className="spinner"></span> : <><MdAdd size={20} /> 新增單字</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddWord;
