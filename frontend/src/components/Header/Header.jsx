import React from 'react';
import './Header.css';

export default function Header({ onTestClick }) {
    return (
        <header className="app-header">
            {onTestClick && (
                <button className="test-btn" onClick={onTestClick}>
                    Test API
                </button>
            )}
            <h1 className="app-title">StreamWeaver</h1>
            <p className="app-subtitle">
                High-Throughput No-Code ETL Pipeline
            </p>
        </header>
    );
}