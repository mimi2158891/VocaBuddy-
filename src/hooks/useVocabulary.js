import { useState, useCallback } from 'react';
import { api } from '../services/api';

export function useVocabulary() {
  const [vocabulary, setVocabulary] = useState(() => {
    const cached = localStorage.getItem('vocab_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVocabulary = useCallback(async () => {
    // Only show loading spinner if we have no cached data
    if (vocabulary.length === 0) setLoading(true);
    setError(null);
    try {
      const data = await api.getVocabulary();
      setVocabulary(data);
      // Cache the result
      localStorage.setItem('vocab_cache', JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vocabulary.length]);

  const addWord = async (wordData) => {
    setError(null);
    const tempId = `temp-${Date.now()}`;
    const newEntry = { 
      id: tempId, 
      folder: wordData.folder || 'Uncategorized', // Auto-default
      ...wordData, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'syncing' 
    };
    
    // 1. Update UI immediately
    setVocabulary(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('vocab_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      const result = await api.createWord(wordData);
      if (result && result.id) {
        // 2. Update with real ID from server
        setVocabulary(prev => {
          const updated = prev.map(item => 
            item.id === tempId ? { ...item, id: result.id, status: 'new' } : item
          );
          localStorage.setItem('vocab_cache', JSON.stringify(updated));
          return updated;
        });
      }
      return true;
    } catch (err) {
      setError(`Failed to add word: ${err.message}`);
      // Rollback
      setVocabulary(prev => prev.filter(item => item.id !== tempId));
      return false;
    }
  };

  const updateWord = async (id, data) => {
    setError(null);
    const previousVocab = [...vocabulary];
    
    // 1. Update UI immediately
    setVocabulary(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
      );
      localStorage.setItem('vocab_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      const result = await api.updateWord(id, data);
      if (!result) throw new Error("Update failed");
      return true;
    } catch (err) {
      setError(`Update failed: ${err.message}`);
      // 2. Rollback on failure
      setVocabulary(previousVocab);
      localStorage.setItem('vocab_cache', JSON.stringify(previousVocab));
      return false;
    }
  };

  const deleteWord = async (id) => {
    setError(null);
    const previousVocab = [...vocabulary];

    // 1. Update UI immediately
    setVocabulary(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('vocab_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      const result = await api.deleteWord(id);
      if (!result) throw new Error("Delete failed");
      return true;
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
      // 2. Rollback on failure
      setVocabulary(previousVocab);
      localStorage.setItem('vocab_cache', JSON.stringify(previousVocab));
      return false;
    }
  };

  const deleteFolder = async (folderName) => {
    setError(null);
    const previousVocab = [...vocabulary];

    // 1. Update UI immediately
    setVocabulary(prev => {
      // Keep words that DO NOT match target folder
      // Account for empty strings matching 'Uncategorized' for local display
      const updated = prev.filter(item => {
        const itemFolder = item.folder || 'Uncategorized';
        const target = folderName || 'Uncategorized';
        return itemFolder !== target;
      });
      localStorage.setItem('vocab_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      const result = await api.deleteFolder(folderName);
      if (!result) throw new Error("Bulk delete failed");
      return true;
    } catch (err) {
      if (err.message && err.message.includes('找不到工作表')) {
        // Backend race condition - the sheet is already deleted
        return true;
      }
      setError(`Delete Folder failed: ${err.message}`);
      // 2. Rollback on failure
      setVocabulary(previousVocab);
      localStorage.setItem('vocab_cache', JSON.stringify(previousVocab));
      return false;
    }
  };

  // Derive unique folders dynamically
  const folders = Array.from(new Set(
    vocabulary.map(item => item.folder?.trim() || 'Uncategorized')
  )).sort();

  return {
    vocabulary,
    folders,
    loading,
    error,
    fetchVocabulary,
    addWord,
    updateWord,
    deleteWord,
    deleteFolder
  };
}
