const StudyLogService = {
  /**
   * Log a study event to the study_logs sheet
   * Data payload: { word_id, recall_time, rating, timestamp, session_id }
   */
  logStudy: function(data) {
    const sheetName = 'study_logs';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Auto-create study_logs sheet if not exists
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const headers = ['session_id', 'word_id', 'rating', 'recall_time', 'timestamp'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const now = new Date().toISOString();
    const rowData = [
      data.session_id || "", 
      data.word_id || "", 
      data.rating || "", 
      data.recall_time || 0, 
      data.timestamp || now
    ];
    
    sheet.appendRow(rowData);
    
    return {
      status: 'success',
      message: 'Study log recorded'
    };
  },

  /**
   * Calculate study statistics from the study_logs sheet
   */
  getStats: function() {
    const sheetName = 'study_logs';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return { totalReviews: 0, sessions: 0, retentionRate: 0, avgRecall: 0 };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { totalReviews: 0, sessions: 0, retentionRate: 0, avgRecall: 0 };
    }
    
    const rows = data.slice(1); // Remove headers
    
    const totalReviews = rows.length;
    const sessionIds = new Set(rows.map(r => r[0]));
    const sessions = sessionIds.size;
    
    const goodEasyCount = rows.filter(r => r[2] === 'Good' || r[2] === 'Easy').length;
    const retentionRate = totalReviews > 0 ? Math.round((goodEasyCount / totalReviews) * 100) : 0;
    
    const totalRecallTime = rows.reduce((sum, r) => sum + (parseFloat(r[3]) || 0), 0);
    const avgRecall = totalReviews > 0 ? (totalRecallTime / totalReviews).toFixed(1) : 0;
    
    return {
      totalReviews: totalReviews,
      sessions: sessions,
      retentionRate: retentionRate,
      avgRecall: parseFloat(avgRecall)
    };
  }
};
