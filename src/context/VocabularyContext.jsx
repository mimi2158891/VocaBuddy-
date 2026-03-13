import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const VocabularyContext = createContext();

export const VocabularyProvider = ({ children }) => {
  const [vocabulary, setVocabulary] = useState(() => {
    const cached = localStorage.getItem('vocab_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVocabulary = useCallback(async (force = false) => {
    // If we have data and not forcing, skip loading state
    if (vocabulary.length === 0 || force) setLoading(true);
    setError(null);
    try {
      const data = await api.getVocabulary();
      // Filter out study_logs from the vocabulary data
      const filteredData = data.filter(item => (item.folder || '').trim() !== 'study_logs');
      setVocabulary(filteredData);
      localStorage.setItem('vocab_cache', JSON.stringify(filteredData));
      return filteredData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addWord = async (wordData) => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.createWord(wordData);
      if (result && result.id) {
        const newEntry = { 
          ...wordData, 
          id: result.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'new' 
        };
        setVocabulary(prev => {
          const updated = [newEntry, ...prev];
          localStorage.setItem('vocab_cache', JSON.stringify(updated));
          return updated;
        });
        return true;
      }
      return false;
    } catch (err) {
      setError(`Failed to add word: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importWords = async (dataList) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.importCSV(dataList);
      if (result) {
        // Refresh full list after successful import to ensure data consistency
        await fetchVocabulary(true);
        return result;
      }
      return null;
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateWord = async (id, data) => {
    setError(null);
    try {
      const result = await api.updateWord(id, data);
      if (result) {
        setVocabulary(prev => {
          const updated = prev.map(item => 
            item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
          );
          localStorage.setItem('vocab_cache', JSON.stringify(updated));
          return updated;
        });
        return true;
      }
      return false;
    } catch (err) {
      setError(`Update failed: ${err.message}`);
      return false;
    }
  };

  const deleteWord = async (id) => {
    setError(null);
    try {
      const result = await api.deleteWord(id);
      if (result) {
        setVocabulary(prev => {
          const updated = prev.filter(item => item.id !== id);
          localStorage.setItem('vocab_cache', JSON.stringify(updated));
          return updated;
        });
        return true;
      }
      return false;
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
      return false;
    }
  };

  const deleteFolder = async (folderName) => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.deleteFolder(folderName);
      if (result) {
        setVocabulary(prev => {
          const updated = prev.filter(item => (item.folder || 'Uncategorized') !== (folderName || 'Uncategorized'));
          localStorage.setItem('vocab_cache', JSON.stringify(updated));
          return updated;
        });
        return true;
      }
      return false;
    } catch (err) {
      setError(`Delete folder failed: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logStudyEvent = async (studyData) => {
    return await api.logStudy(studyData);
  };

  const folders = Array.from(new Set(
    vocabulary.map(item => item.folder?.trim() || 'Uncategorized')
  )).filter(f => f !== 'study_logs').sort();

  return (
    <VocabularyContext.Provider value={{
      vocabulary,
      folders,
      loading,
      error,
      fetchVocabulary,
      addWord,
      importWords,
      updateWord,
      deleteWord,
      deleteFolder,
      logStudyEvent
    }}>
      {children}
    </VocabularyContext.Provider>
  );
};

export const useVocabulary = () => {
  const context = useContext(VocabularyContext);
  if (!context) {
    throw new Error('useVocabulary must be used within a VocabularyProvider');
  }
  return context;
};
