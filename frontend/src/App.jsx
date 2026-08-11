import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

export default function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const fileInputRef = useRef(null);

  // Validate that the file is either a CSV or JSON file
  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isCsvOrJson = fileName.endsWith('.csv') || fileName.endsWith('.json');

    if (!isCsvOrJson) {
      setError('Invalid file type! Please upload a .csv or .json file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Input File Selection Handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Upload file stream to Express backend
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        setHeaders(response.data.headers || []);
        setPreviewData(response.data.rows || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stream file preview from server.');
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
        {/* Drag and Drop Zone */}
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="dropzone-content">
            <p className="drop-text">
              Drag & drop your <strong>.csv</strong> or <strong>.json</strong> file here
            </p>
            <p className="sub-text">or</p>

            {/* Hidden File Input */}
            <input
              type="file"
              accept=".csv, .json"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Select File Button */}
            <button
              type="button"
              className="select-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </button>
          </div>

          {/* Selected File Badge */}
          {file && (
            <div className="file-badge">
              📄 <strong>Selected:</strong> {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && <div className="error-message">{error}</div>}

        {/* Generate Preview Trigger */}
        {file && (
          <button
            type="button"
            className="upload-btn"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? 'Streaming Data...' : 'Generate 1,000 Row Preview'}
          </button>
        )}

        {/* Data Preview Placeholder */}
        {previewData.length > 0 && (
          <div className="preview-container">
            <h3 className="preview-title">Preview Data ({previewData.length} rows)</h3>
            <p className="preview-subtitle">
              Extracted Headers: <code>{headers.join(', ')}</code>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}