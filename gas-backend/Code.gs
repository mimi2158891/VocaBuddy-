/**
 * Google Apps Script Web App Entry Points
 * Deploy as Web App, execute as "Me", access "Anyone"
 */

function doGet(e) {
  try {
    const path = e.parameter.path;
    
    if (!path || path === 'vocabulary') {
      const data = VocabularyService.getAll();
      return ResponseHelper.success(data);
    }
    
    return ResponseHelper.error('Not Found', 404);
  } catch (error) {
    return ResponseHelper.error(error.toString(), 500);
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // POST /vocabulary (Create)
    if (action === 'create') {
      const result = VocabularyService.create(postData.data);
      return ResponseHelper.success(result);
    }
    
    // POST /vocabulary/import
    if (action === 'import') {
      const result = VocabularyService.importCSV(postData.data);
      return ResponseHelper.success(result);
    }
    
    // PUT /vocabulary/:id
    if (action === 'update') {
      const result = VocabularyService.update(postData.id, postData.data);
      return ResponseHelper.success(result);
    }
    
    // DELETE /vocabulary/:id
    if (action === 'delete') {
      const result = VocabularyService.deleteRecord(postData.id);
      return ResponseHelper.success(result);
    }

    // DELETE /folder
    if (action === 'deleteFolder') {
      const result = VocabularyService.deleteFolder(postData.folder);
      return ResponseHelper.success(result);
    }

    return ResponseHelper.error('Invalid action', 400);
  } catch (error) {
    return ResponseHelper.error(error.toString(), 500);
  }
}

/**
 * Handle CORS Preflight request
 */
function doOptions(e) {
  return ResponseHelper.cors();
}
