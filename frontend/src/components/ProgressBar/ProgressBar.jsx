import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ progress }) {
    if (!progress) return null;

    const { rowsProcessed, rowsPerSecond, status } = progress;

    return (
        <div className="progress-container">
            <div className="progress-info">
                <span>{status === 'completed' ? 'Completed' : 'Processing...'}</span>
                <span>{rowsProcessed.toLocaleString()} rows · {rowsPerSecond.toLocaleString()} rows/sec</span>
            </div>
            <div className="progress-track">
                <div
                    className={`progress-fill ${status === 'completed' ? 'complete' : ''}`}
                    style={{ width: status === 'completed' ? '100%' : undefined }}
                />
            </div>
        </div>
    );
}