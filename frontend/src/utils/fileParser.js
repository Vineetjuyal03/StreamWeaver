import Papa from 'papaparse';

/**
 * Parses the first chunk of a local file (CSV or JSON) inside the browser.
 */
export const parseFilePreview = (file, maxRows = 1000) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided.'));
    }

    const fileName = file.name;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const isCsv = fileName.toLowerCase().endsWith('.csv');
    const isJson = fileName.toLowerCase().endsWith('.json');

    if (!isCsv && !isJson) {
      return reject(new Error('Unsupported file type. Please upload a .csv or .json file.'));
    }

    // Slice only the first 1 MB chunk
    const CHUNK_SIZE = 1 * 1024 * 1024;
    const fileSlice = file.slice(0, CHUNK_SIZE);

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;

      if (isCsv) {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          preview: maxRows, // Halts parsing at 1,000 rows
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data || [];
            resolve({ headers, rows, fileName, fileSizeMB });
          },
          error: (err) => reject(new Error(`CSV Parsing Error: ${err.message}`)),
        });
      } else if (isJson) {
        try {
          let text = content.trim();
          if (text.startsWith('[')) {
            const lastCloseBracket = text.lastIndexOf('}');
            if (lastCloseBracket !== -1) {
              text = text.substring(0, lastCloseBracket + 1) + ']';
            }
          }

          let parsedData = JSON.parse(text);
          if (!Array.isArray(parsedData)) {
            parsedData = [parsedData];
          }

          const slicedRows = parsedData.slice(0, maxRows);
          const headers = slicedRows.length > 0 ? Object.keys(slicedRows[0]) : [];

          resolve({ headers, rows: slicedRows, fileName, fileSizeMB });
        } catch (err) {
          reject(new Error('Invalid JSON format in the preview slice.'));
        }
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file slice.'));
    reader.readAsText(fileSlice);
  });
};