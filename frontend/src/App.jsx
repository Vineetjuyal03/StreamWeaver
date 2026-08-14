import React, { useState } from 'react';
import DropZone from './components/DropZone/DropZone';
import PreviewTable from './components/PreviewTable/PreviewTable';
import { parseFilePreview } from './utils/fileParser';
import './App.css';

export default function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handler when user selects or drops a file
  const handleFileSelect = async (selectedFile) => {
    setError('');
    setLoading(true);
    setPreviewRows([]);
    setHeaders([]);

    try {
      // Parse first 1MB chunk directly in browser memory
      const result = await parseFilePreview(selectedFile, 1000);

      setFileInfo({
        name: result.fileName,
        sizeMB: result.fileSizeMB,
        rawFile: selectedFile,
      });
      setHeaders(result.headers);
      setPreviewRows(result.rows);
    } catch (err) {
      setError(err.message || 'Error processing file preview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">StreamWeaver</h1>
        <p className="app-subtitle">High-Throughput No-Code ETL Pipeline</p>
      </header>

      <main className="app-main">
        {/* Step 1: DropZone File Input */}
        <DropZone onFileSelect={handleFileSelect} disabled={loading} />

        {/* Loading Indicator */}
        {loading && (
          <div className="status-banner loading">
            ⚡ Parsing first 1,000 rows in memory...
          </div>
        )}

        {/* Error Alert */}
        {error && <div className="status-banner error">{error}</div>}

        {/* Step 2: Virtualized 1,000 Row Preview Table */}
        {previewRows.length > 0 && (
          <PreviewTable
            headers={headers}
            rows={previewRows}
            fileName={fileInfo?.name}
            fileSizeMB={fileInfo?.sizeMB}
          />
        )}
      </main>
    </div>
  );
}