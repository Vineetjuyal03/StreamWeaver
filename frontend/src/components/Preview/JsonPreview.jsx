import React from 'react';
import { List } from 'react-window';
import './JsonPreview.css';

const ROW_HEIGHT = 160;
const VIEWPORT_HEIGHT = 400;

function VirtualJsonRow({ index, style, rows }) {
  const item = rows[index];

  return (
    <div
      style={style}
      className={`json-row-container ${index % 2 === 0 ? 'even' : 'odd'}`}
    >
      <div className="json-row-header">
        <span className="json-row-index">#{index + 1}</span>
      </div>
      <pre className="json-code-block">
        <code>{JSON.stringify(item, null, 2)}</code>
      </pre>
    </div>
  );
}

export default function JsonPreview({
  rows = [],
  fileName,
  fileSizeMB,
}) {
  if (!rows.length) return null;

  return (
    <div className="preview-card">
      {/* Header */}
      <div className="preview-header">
        <div>
          <h3 className="preview-title">JSON Data Preview</h3>
          <p className="preview-meta">
            Showing first <strong>{rows.length}</strong> objects from{' '}
            <code>{fileName}</code>
            {fileSizeMB != null && <> ({fileSizeMB} MB)</>}
          </p>
        </div>
        <div className="column-badge json-badge">JSON Format</div>
      </div>

      {/* Virtualized List Container */}
      <div className="json-preview-wrapper">
        <List
          rowComponent={VirtualJsonRow}
          rowCount={rows.length}
          rowHeight={ROW_HEIGHT}
          rowProps={{ rows }}
          overscanCount={3}
          style={{
            height: VIEWPORT_HEIGHT,
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}