// API URL is now retrieved via getBaseUrl() to ensure latest env values are used

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
 * If missing, it returns an empty string which will cause a descriptive error in the fetch methods.
 */
const getBaseUrl = () => {
    const url = import.meta.env.VITE_GAS_API_URL;
    console.log("Current API URL from env:", url);
    if (!url || url === "undefined" || url.includes("your_google_apps_script_url")) {
        console.error("CRITICAL: VITE_GAS_API_URL is missing or using placeholder! Please set it in .env or GitHub Secrets.");
        return "";
    }
    return url;
};

/**
 * API Service for interacting with Google Apps Script backend.
 */
export const api = {
  getVocabulary: async () => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL 未設定。請檢查 VITE_GAS_API_URL 環境變數。");
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
      if (!baseUrl) throw new Error("API URL 未設定。");
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
      if (!baseUrl) throw new Error("API URL 未設定。");
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
      if (!baseUrl) throw new Error("API URL 未設定。");
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
      if (!baseUrl) throw new Error("API URL 未設定。");
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
      if (!baseUrl) throw new Error("API URL 未設定。");
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
  },

  logStudy: async (studyData) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL 未設定。");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'logStudy', data: studyData })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      return result.status === 'success';
    } catch (error) {
      console.error("API Error (logStudy):", error);
      return false;
    }
  },

  getStats: async () => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) throw new Error("API URL 未設定。");
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getStats' })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await checkJsonResponse(response);
      if (result.status === 'success') return result.data;
      throw new Error(result.message || 'Failed to fetch stats');
    } catch (error) {
      console.error("API Error (getStats):", error);
      throw error;
    }
  }
};
