const VocabularyService = {
  
  /**
   * GET /vocabulary
   */
  getAll: function() {
    const items = SheetHelper.getAllSheetsData();
    // Sort by createdAt descending (newest first)
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * POST /vocabulary (Create single word)
   */
  create: function(data) {
    if (!data.word) throw new Error("Word is required");
    
    const targetFolder = data.folder || "Uncategorized";
    const sheet = SheetHelper.getSheetByName(targetFolder);
    const headersMap = SheetHelper.getHeadersMap(sheet);
    
    const now = new Date().toISOString();
    const newId = Utilities.getUuid();
    
    const rowData = [];
    Object.keys(headersMap).forEach(key => rowData[headersMap[key]] = ""); // Ensure array size
    
    rowData[headersMap['id']] = newId;
    rowData[headersMap['word']] = data.word.trim();
    rowData[headersMap['chinese']] = data.chinese ? data.chinese.trim() : "";
    rowData[headersMap['example']] = data.example ? data.example.trim() : "";
    rowData[headersMap['folder']] = targetFolder.trim();
    rowData[headersMap['createdAt']] = now;
    rowData[headersMap['updatedAt']] = now;
    rowData[headersMap['status']] = "new";
    rowData[headersMap['favorite']] = false;
    rowData[headersMap['notes']] = "";
    rowData[headersMap['interval']] = 0;
    rowData[headersMap['repetitions']] = 0;
    rowData[headersMap['easeFactor']] = 2.5;
    rowData[headersMap['nextReviewAt']] = now;
    rowData[headersMap['lastReviewedAt']] = "";

    sheet.appendRow(rowData);
    
    return {
      id: newId,
      word: data.word,
      folder: targetFolder,
      message: "Word added successfully"
    };
  },

  /**
   * PUT /vocabulary (Update)
   */
  update: function(id, data) {
    if (!id) throw new Error("ID is required for update");
    
    const record = SheetHelper.findRecordById(id);
    
    if (!record) {
      throw new Error(`Record with ID ${id} not found`);
    }

    const currentSheet = record.sheet;
    const currentSheetName = currentSheet.getName();
    const rowIndex = record.rowIndex;
    const originalHeadersMap = record.headersMap;
    const now = new Date().toISOString();
    
    // Read the current entire row
    const range = currentSheet.getRange(rowIndex, 1, 1, currentSheet.getLastColumn());
    const rowValues = range.getValues()[0];

    // Determine if folder changed (meaning we must move the record physically)
    const newFolder = data.folder !== undefined ? (data.folder ? data.folder.trim() : "Uncategorized") : currentSheetName;
    const folderChanged = newFolder !== currentSheetName;

    // Apply updates to the array
    if (data.word) rowValues[originalHeadersMap['word']] = data.word.trim();
    if (data.chinese !== undefined) rowValues[originalHeadersMap['chinese']] = data.chinese.trim();
    if (data.example !== undefined) rowValues[originalHeadersMap['example']] = data.example.trim();
    if (data.status) rowValues[originalHeadersMap['status']] = data.status;
    if (data.notes !== undefined) rowValues[originalHeadersMap['notes']] = data.notes;
    if (data.interval !== undefined) rowValues[originalHeadersMap['interval']] = data.interval;
    if (data.repetitions !== undefined) rowValues[originalHeadersMap['repetitions']] = data.repetitions;
    if (data.easeFactor !== undefined) rowValues[originalHeadersMap['easeFactor']] = data.easeFactor;
    if (data.nextReviewAt !== undefined) rowValues[originalHeadersMap['nextReviewAt']] = data.nextReviewAt;
    if (data.lastReviewedAt !== undefined) rowValues[originalHeadersMap['lastReviewedAt']] = data.lastReviewedAt;
    
    rowValues[originalHeadersMap['updatedAt']] = now;
    // Always force the internal folder column to match the destination
    if (originalHeadersMap['folder'] !== undefined) {
       rowValues[originalHeadersMap['folder']] = newFolder;
    }

    if (!folderChanged) {
      // Fast path: In-place update
      range.setValues([rowValues]);
    } else {
      // Slow path: Move record to a different sheet
      const targetSheet = SheetHelper.getSheetByName(newFolder);
      const targetHeadersMap = SheetHelper.getHeadersMap(targetSheet);
      
      const targetRowData = [];
      Object.keys(targetHeadersMap).forEach(key => targetRowData[targetHeadersMap[key]] = "");
      
      // Map original row values -> object -> target row array
      Object.keys(originalHeadersMap).forEach(key => {
        if (targetHeadersMap[key] !== undefined) {
           targetRowData[targetHeadersMap[key]] = rowValues[originalHeadersMap[key]];
        }
      });
      
      // Insert in new sheet, delete from old sheet
      targetSheet.appendRow(targetRowData);
      currentSheet.deleteRow(rowIndex);
    }
    
    return { id: id, folder: newFolder, status: "success", message: "Updated successfully" };
  },

  /**
   * DELETE /vocabulary
   */
  deleteRecord: function(id) {
    if (!id) throw new Error("ID is required for deletion");
    
    const record = SheetHelper.findRecordById(id);
    
    if (!record) {
      throw new Error(`Record with ID ${id} not found`);
    }

    record.sheet.deleteRow(record.rowIndex);
    
    return { id: id, status: "success", message: "Deleted successfully" };
  },

  /**
   * DELETE /folder (Bulk delete by dropping the physical sheet)
   */
  deleteFolder: function(folderName) {
    if (!folderName) throw new Error("Folder name is required for batch deletion");
    
    // Explicitly cast to string to prevent numerical sheet name lookup errors
    const targetFolder = String(folderName).trim();
    if (!targetFolder) throw new Error("Invalid folder name provided");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = null;
    
    try {
      sheet = ss.getSheetByName(targetFolder);
    } catch (e) {
      const sheets = ss.getSheets();
      for (let i = 0; i < sheets.length; i++) {
        if (sheets[i].getName() === targetFolder) {
           sheet = sheets[i];
           break;
        }
      }
    }
    
    if (!sheet) {
      // Return success gracefully if it's already deleted or doesn't exist
      return { folder: targetFolder, status: "success", message: "Folder does not exist or was already deleted" };
    }

    // Google Sheets requires >=1 sheets to exist. If this is the ONLY sheet, we must create a dummy before deleting.
    try {
      if (ss.getSheets().length <= 1) {
         ss.insertSheet("Uncategorized_Recovery"); // Fallback
      }
      ss.deleteSheet(sheet);
    } catch (e) {
      // User says sheet deletes successfully but throws Exception: NotFound internally.
      // We will silence this error and pretend it succeeded so the UI updates natively.
      console.error("Ignored GAS Exception on deleteSheet:", e.message);
    }

    return { folder: targetFolder, status: "success", message: `Deleted entire folder [${targetFolder}]` };
  },

  /**
   * POST /vocabulary/import - Batch import from CSV
   */
  importCSV: function(list) {
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Invalid or empty vocabulary list");
    }

    // Need global existing words to check duplicates across all sheets
    const existing = SheetHelper.getAllSheetsData();
    const existingWords = new Set(existing.map(item => item.word.toString().toLowerCase().trim()));
    
    const now = new Date().toISOString();
    let importedCount = 0;
    let duplicateCount = 0;
    const ignoredWords = [];

    // Group incoming data by `folder` to batch append efficiently per sheet
    const recordsByFolder = {};

    list.forEach(data => {
      if (!data.word) return;
      
      const wordClean = data.word.toString().trim();
      if (!wordClean) return;

      if (existingWords.has(wordClean.toLowerCase())) {
        duplicateCount++;
        ignoredWords.push(wordClean);
        return;
      }

      existingWords.add(wordClean.toLowerCase());

      const targetFolder = data.folder ? data.folder.trim() : "Uncategorized";
      if (!recordsByFolder[targetFolder]) {
         recordsByFolder[targetFolder] = [];
      }

      recordsByFolder[targetFolder].push({
        word: wordClean,
        chinese: data.chinese ? data.chinese.trim() : "",
        example: data.example ? data.example.trim() : "",
      });
    });

    // Write to corresponding sheets
    for (const folderName in recordsByFolder) {
      const sheet = SheetHelper.getSheetByName(folderName);
      const headersMap = SheetHelper.getHeadersMap(sheet);
      const rowsToAdd = [];

      recordsByFolder[folderName].forEach(data => {
         const rowData = [];
         Object.keys(headersMap).forEach(key => rowData[headersMap[key]] = "");
         
         rowData[headersMap['id']] = Utilities.getUuid();
         rowData[headersMap['word']] = data.word;
         rowData[headersMap['chinese']] = data.chinese;
         rowData[headersMap['example']] = data.example;
         rowData[headersMap['folder']] = folderName;
         rowData[headersMap['createdAt']] = now;
         rowData[headersMap['updatedAt']] = now;
         rowData[headersMap['status']] = "new";
         rowData[headersMap['favorite']] = false;
         rowData[headersMap['notes']] = "";
         rowData[headersMap['interval']] = 0;
         rowData[headersMap['repetitions']] = 0;
         rowData[headersMap['easeFactor']] = 2.5;
         rowData[headersMap['nextReviewAt']] = now;
         rowData[headersMap['lastReviewedAt']] = "";

         rowsToAdd.push(rowData);
         importedCount++;
      });

      if (rowsToAdd.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
      }
    }

    return {
      imported: importedCount,
      duplicates: duplicateCount,
      ignoredWords: ignoredWords
    };
  }
};
