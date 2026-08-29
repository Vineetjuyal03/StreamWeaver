import React from 'react';
import './UploadButton.css';

export default function UploadButton({ onUpload, disabled, status }) {
    return (
        <div className="upload-section">
            <button
                className="upload-button"
                onClick={onUpload}
                disabled={disabled}
            >
                {status?.state === 'uploading' ? 'Uploading...' : 'Upload to MongoDB'}
            </button>

            {status?.state === 'success' && (
                <div className="status-banner success">
                    ✅ {status.message} — {status.rowsInserted} rows inserted
                </div>
            )}

            {status?.state === 'error' && (
                <div className="status-banner error">
                    ❌ {status.message}
                </div>
            )}
        </div>
    );
}