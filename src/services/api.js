const API_URL = import.meta.env.VITE_GAS_API_URL;

/**
 * Utility to check if the response is JSON
 */
const checkJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Expected JSON but received non-JSON response:", text.substring(0, 200));
    throw new Error("Server returned HTML instead of JSON. This usually means the API URL is wrong or the server returned a 404/login page.");
  }
  return response.json();
};

/**
 * Robustly get the API URL. 
 * If missing, it returns a placeholder and logs an error instead of throwing immediately,
 * which prevents build-time crashes if a plugin imports this module.
 */
const getBaseUrl = () => {
    if (!API_URL || API_URL === "undefined") {
        console.error("WARNING: VITE_GAS_API_URL is not defined! Requests will fail at runtime.");
        return ""; // Fallback to empty string to prevent crash, but fetch will fail later
    }
    return API_URL;
};

/**
 * API Service for interacting with Google Apps Script backend.
 */
export const api = {
  getVocabulary: async () => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL is missing. Check VITE_GAS_API_URL.");
      const response = await fetch(`${baseUrl}?path=vocabulary`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      if (result.status === 'success') return result.data;
      throw new Error(result.message || 'Failed to fetch vocabulary');
    } catch (error) {
      console.error("API Error (getVocabulary):", error);
      throw error;
    }
  },

  createWord: async (data) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL is missing.");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'create', data })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      if (result.status === 'success') return result.data;
      throw new Error(result.message || 'Failed to add word');
    } catch (error) {
      console.error("API Error (createWord):", error);
      throw error;
    }
  },

  importCSV: async (dataList) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL is missing.");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'import', data: dataList })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      if (result.status === 'success') return result.data;
      throw new Error(result.message || 'Failed to import CSV');
    } catch (error) {
      console.error("API Error (importCSV):", error);
      throw error;
    }
  },

  updateWord: async (id, data) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL is missing.");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update', id, data })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      return result.status === 'success';
    } catch (error) {
      console.error("API Error (updateWord):", error);
      throw error;
    }
  },

  deleteWord: async (id) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL is missing.");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      return result.status === 'success';
    } catch (error) {
      console.error("API Error (deleteWord):", error);
      throw error;
    }
  },

  deleteFolder: async (folderName) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL is missing.");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteFolder', folder: folderName })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      return result.status === 'success';
    } catch (error) {
      if (error.message?.includes('找不到工作表')) return true; 
      console.error("API Error (deleteFolder):", error);
      throw error;
    }
  }
};
