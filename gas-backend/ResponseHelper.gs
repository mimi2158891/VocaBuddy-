const ResponseHelper = {
  /**
   * Return Success JSON
   */
  success: function(data) {
    const response = {
      status: 'success',
      data: data
    };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  },

  /**
   * Return Error JSON
   */
  error: function(message, code) {
    const response = {
      status: 'error',
      message: message,
      code: code || 500
    };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  },
  
  /**
   * Note: GAS doOptions doesn't completely solve all CORS on fetch, 
   * but Web App execution handles GET/POST redirects natively.
   * We still keep this just in case.
   */
  cors: function() {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }
};
