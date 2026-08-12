import React, { useState, useRef } from 'react';
import './DropZone.css';

export default function DropZone({ onFileSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Handle drag hover state
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle dropped file
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle standard file picker selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`dropzone-card ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="dropzone-body">
        <span className="dropzone-icon">📁</span>
        <h3 className="dropzone-text">Drag & drop your CSV or JSON file here</h3>
        <p className="dropzone-subtext">Supports multi-gigabyte files with instant client-side preview</p>

        {/* Hidden File Input */}
        <input
          type="file"
          accept=".csv, .json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <button
          type="button"
          className="browse-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          Select File
        </button>
      </div>
    </div>
  );
}