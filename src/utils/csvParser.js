export const parseCSV = (text) => {
  if (!text) return [];

  const lines = text.split('\n');
  const result = [];
  
  // Assuming the first line might be a header.
  // We'll flexibly accept with or without headers (word, chinese, example)
  // If no header, we assume order: word, chinese, example
  
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('word') || firstLine.includes('chinese')) {
    startIndex = 1; // skip header
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple split by comma. 
    // For robust CSV parsing with quotes you would use a regex or library,
    // but this is a lightweight approach suitable for portfolio.
    // Handling basic quoted strings (e.g. "To be, or not to be")
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    // Cleanup quotes from values
    const cleanValue = (val) => val ? val.replace(/^"|"$/g, '').trim() : '';
    
    const word = cleanValue(cols[0]);
    if (!word) continue; // Skip lines without word

    const chinese = cleanValue(cols[1]);
    const example = cleanValue(cols[2]);

    result.push({
      word,
      chinese,
      example
    });
  }

  return result;
};
