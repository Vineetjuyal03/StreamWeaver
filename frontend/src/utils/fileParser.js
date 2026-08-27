import { JSONParser } from '@streamparser/json-whatwg';
import Papa from 'papaparse';

/**
 * Main entry point: Auto-detects file type and processes streams up to maxRows.
 */
export async function parseFileStream(file, maxRows = 1000) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.json') || file.type === 'application/json') {
    return await parseJsonStream(file, maxRows);
  } else if (fileName.endsWith('.csv') || file.type === 'text/csv') {
    return await parseCsvStream(file, maxRows);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or JSON file.');
  }
}

/**
 * Helper to calculate size in MB formatted to 2 decimal places.
 */
function getFileSizeMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

/**
 * Streams up to maxRows from a JSON file and extracts headers for mapping.
 */
export async function parseJsonStream(file, maxRows = 1000) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let records = [];
  const headersSet = new Set();

  try {
    while (records.length < maxRows) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Attempt standard JSON parse if buffer forms a valid segment
      try {
        const parsed = JSON.parse(buffer);
        const values = Array.isArray(parsed) ? parsed : Object.values(parsed);
        
        records = values.slice(0, maxRows);
        records.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((k) => headersSet.add(k));
          }
        });
        
        reader.cancel();
        break;
      } catch (e) {
        // Continue streaming chunks until JSON slice becomes valid
      }
    }
  } catch (err) {
    // Handle cancellation
  }

  return {
    fileName: file.name,
    fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
    headers: Array.from(headersSet),
    rows: records,
    type: 'json',
  };
}
/**
 * Streams up to maxRows from a CSV file.
 */
export function parseCsvStream(file, maxRows = 1000) {
  return new Promise((resolve, reject) => {
    const records = [];
    let headers = [];

    Papa.parse(file, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      step: function (row, parser) {
        if (headers.length === 0 && row.meta && row.meta.fields) {
          headers = row.meta.fields;
        }

        records.push(row.data);

        if (records.length >= maxRows) {
          parser.abort();
          resolve({
            fileName: file.name,
            fileSizeMB: getFileSizeMB(file.size),
            headers: headers,
            rows: records,
            type: 'csv',
          });
        }
      },
      complete: function () {
        resolve({
          fileName: file.name,
          fileSizeMB: getFileSizeMB(file.size),
          headers: headers,
          rows: records,
          type: 'csv',
        });
      },
      error: function (err) {
        reject(err);
      },
    });
  });
}