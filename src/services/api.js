const API_URL = import.meta.env.VITE_GAS_API_URL;

if (!API_URL) {
  console.warn("Missing VITE_GAS_API_URL in .env file");
}

export const api = {
  /**
   * Fetch all vocabulary words
   */
  getVocabulary: async () => {
    try {
      const response = await fetch(`${API_URL}?path=vocabulary`, {
        method: 'GET',
        // Note: GAS requires no-cors for some environments, but to read JSON we need standard cors/cors-like behavior
        // Using standard fetch, GAS handles redirects automatically.
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch vocabulary');
    } catch (error) {
      console.error("API Error (getVocabulary):", error);
      throw error;
    }
  },

  /**
   * Add a new word
   */
  createWord: async (data) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        // Use text/plain for GAS to avoid CORS preflight issues across browsers in some cases
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'create',
          data: data
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to add word');
    } catch (error) {
      console.error("API Error (createWord):", error);
      throw error;
    }
  },

  /**
   * Import multiple words (CSV)
   */
  importCSV: async (dataList) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'import',
          data: dataList
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to import CSV');
    } catch (error) {
      console.error("API Error (importCSV):", error);
      throw error;
    }
  },

  /**
   * Update an existing word
   */
  updateWord: async (id, data) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'update',
          id: id,
          data: data
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to update word');
    } catch (error) {
      console.error("API Error (updateWord):", error);
      throw error;
    }
  },

  /**
   * Delete a word
   */
  deleteWord: async (id) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'delete',
          id: id
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to delete word');
    } catch (error) {
      console.error("API Error (deleteWord):", error);
      throw error;
    }
  },

  /**
   * Bulk delete entirely by folder
   */
  deleteFolder: async (folderName) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'deleteFolder',
          folder: folderName
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to bulk delete folder');
    } catch (error) {
      console.error("API Error (deleteFolder):", error);
      throw error;
    }
  }
};
