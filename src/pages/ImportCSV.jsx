import React, { useState, useRef } from 'react';
import { MdCloudUpload, MdCheckCircle, MdError, MdWarning } from 'react-icons/md';
import { parseCSV } from '../utils/csvParser';
import { useImport } from '../hooks/useImport';
import { useVocabulary } from '../hooks/useVocabulary';
import './ImportCSV.css';

const ImportCSV = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importStatus, setImportStatus] = useState(null); // { type, message, details }
  const [targetFolder, setTargetFolder] = useState('Uncategorized');
  const fileInputRef = useRef(null);
  const { importWords, loading } = useImport();
  const { folders } = useVocabulary();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setImportStatus({ type: 'error', message: '請選擇有效的 CSV 檔案。' });
      return;
    }

    setFile(selectedFile);
    setImportStatus(null);
    setPreviewData([]);
    
    // Auto-set the folder name based on the CSV file name
    const fileNameWithoutExtension = selectedFile.name.replace(/\.csv$/, '');
    setTargetFolder(fileNameWithoutExtension);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          setPreviewData(parsed);
        } else {
          setImportStatus({ type: 'error', message: 'CSV 檔案中未找到有效資料。' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: '無法解析 CSV 檔案。' });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileChange(fakeEvent);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewData([]);
    setImportStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    
    setImportStatus(null);
    
    // Inject the selected folder into all parsed items before importing
    const dataWithFolder = previewData.map(item => ({
      ...item,
      folder: targetFolder
    }));
    
    const result = await importWords(dataWithFolder);
    
    if (result) {
      const ignoredDetails = (result.ignoredWords || []).map(wordStr => {
        const match = dataWithFolder.find(item => item.word.trim().toLowerCase() === wordStr.toLowerCase());
        if (match) {
          return `${match.word} ${match.chinese ? match.chinese : ''}`.trim();
        }
        return wordStr;
      });

      setImportStatus({ 
        type: 'success', 
        message: `匯入完成！已將 ${result.imported} 個新單字加入 [${targetFolder}]。`,
        details: result.duplicates > 0 ? `自動跳過 ${result.duplicates} 個已存在的單字：` : null,
        ignoredList: ignoredDetails
      });
      setFile(null);
      setPreviewData([]);
    } else {
      setImportStatus({ type: 'error', message: '匯入失敗，請稍後再試。' });
    }
  };

  return (
    <div className="page-container fadeIn">
      <header className="page-header">
        <h2>匯入 CSV</h2>
        <p>上傳 CSV 檔案以一次大量新增單字。</p>
      </header>

      <div className="import-container">
        {importStatus && (
          <div className={`alert ${importStatus.type}`}>
            {importStatus.type === 'success' ? <MdCheckCircle size={20} /> : <MdError size={20} />}
            <div className="alert-content">
              <strong>{importStatus.message}</strong>
              {importStatus.details && <p className="alert-details">{importStatus.details}</p>}
              {importStatus.ignoredList && importStatus.ignoredList.length > 0 && (
                <ul className="ignored-list" style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {importStatus.ignoredList.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!previewData.length && !loading && (
          <div 
            className="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <MdCloudUpload size={48} className="upload-icon" />
            <h3>點擊或拖曳 CSV 檔案至此</h3>
            <p className="upload-hint">格式：英文單字, 中文解釋, 例句 (以逗號分隔)</p>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
        )}

        {previewData.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>資料預覽 (共 {previewData.length} 個單字)</h3>
              
              <div className="preview-actions">
                <div className="folder-selection">
                  <label htmlFor="importFolder" style={{marginRight: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>匯入至：</label>
                  <input
                    id="importFolder"
                    type="text"
                    list="folder-options"
                    value={targetFolder}
                    onChange={(e) => setTargetFolder(e.target.value)}
                    placeholder="例如：多益單字"
                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-color)', width: '160px'}}
                  />
                  <datalist id="folder-options">
                    {folders.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
                <button className="btn-secondary" onClick={clearSelection} disabled={loading}>取消</button>
                <button className="btn-primary" onClick={handleImport} disabled={loading}>
                  {loading ? <span className="spinner-small" /> : '確認匯入'}
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>英文單字</th>
                    <th>中文解釋</th>
                    <th>例句</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td><strong>{item.word}</strong></td>
                      <td>{item.chinese}</td>
                      <td className="truncate-cell">{item.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 10 && (
              <p className="preview-more-hint">...以及其他 {previewData.length - 10} 筆資料</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCSV;
