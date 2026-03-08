const SheetHelper = {
  /**
   * Get target sheet by name. Create it if not exists.
   */
  getSheetByName: function(name) {
    const sheetName = name ? String(name).trim() : 'Uncategorized';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = null;
    
    try {
      sheet = ss.getSheetByName(sheetName);
    } catch (e) {
      // GAS bug: passing numeric string to getSheetByName can crash. Fast fallback to manual iteration.
      const sheets = ss.getSheets();
      for (let i = 0; i < sheets.length; i++) {
        if (sheets[i].getName() === sheetName) {
           sheet = sheets[i];
           break;
        }
      }
    }
    
    // Auto-create and initialize headers if not exists
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // We keep 'folder' in headers for backward compatibility with frontend, 
      // though the Sheet's physical name dictates the true category.
      const headers = ['id', 'word', 'chinese', 'example', 'folder', 'createdAt', 'updatedAt', 'status', 'favorite', 'notes', 'interval', 'repetitions', 'easeFactor', 'nextReviewAt', 'lastReviewedAt'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    return sheet;
  },

  /**
   * Get headers row map { headerName: colIndex }
   */
  getHeadersMap: function(sheet) {
    const headersRange = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()));
    const headers = headersRange.getValues()[0];
    const map = {};
    let folderExists = false;
    
    headers.forEach((h, i) => {
      if (h) {
        map[h] = i; // 0-indexed
        if (h === 'folder') folderExists = true;
      }
    });

    // Backward compatibility: If required columns are missing, append them
    const requiredCols = ['folder', 'interval', 'repetitions', 'easeFactor', 'nextReviewAt', 'lastReviewedAt'];
    requiredCols.forEach(col => {
      if (map[col] === undefined && sheet.getLastColumn() > 0) {
        const nextCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, nextCol).setValue(col).setFontWeight('bold');
        map[col] = nextCol - 1;
      }
    });

    return map;
  },

  /**
   * Read all data from ALL sheets as Array of Objects
   */
  getAllSheetsData: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const allData = [];

    sheets.forEach(sheet => {
      try {
        const sheetName = sheet.getName();
        const lastRow = sheet.getLastRow();
        
        if (lastRow <= 1) return; // Only headers or empty

        const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
        const headersMap = this.getHeadersMap(sheet);
        
        data.forEach(row => {
          const obj = {};
          Object.keys(headersMap).forEach(key => {
             obj[key] = row[headersMap[key]];
          });
          
          // Ensure folder always matches physical sheet name
          obj.folder = sheetName;
          allData.push(obj);
        });
      } catch (e) {
        // Race condition: if a sheet is deleted right before this iteration, 
        // GAS throws "Exception: 找不到工作表" when calling sheet methods.
        console.warn("Ignored deleted sheet during iteration: " + e.message);
      }
    });

    return allData;
  },

  /**
   * Find which sheet and which row index (1-based) a give ID exists in.
   * Returns { sheet: Sheet, rowIndex: number, headersMap: object } or null
   */
  findRecordById: function(id) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    
    for (const sheet of sheets) {
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) continue;

      const headersMap = this.getHeadersMap(sheet);
      const idColIndex = headersMap['id'];
      
      if (idColIndex === undefined) continue;

      const ids = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues().flatMap(row => row[0]);
      const index = ids.indexOf(id);
      
      if (index !== -1) {
        return {
          sheet: sheet,
          rowIndex: index + 2, // +2 because ids start from row 2 and index is 0-based
          headersMap: headersMap
        };
      }
    }
    
    return null;
  }
};
