import { useState } from 'react';
import { api } from '../services/api';

export function useImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const importWords = async (vocabularyList) => {
    setLoading(true);
    setError(null);
    try {
      const responseBody = await api.importCSV(vocabularyList);
      return responseBody; // Returns stats: { imported: X, duplicates: Y, ignoredWords: [...] }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, importWords };
}
