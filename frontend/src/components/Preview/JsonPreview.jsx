import React from 'react';
import { List } from 'react-window';
import './JsonPreview.css';

const ROW_HEIGHT = 160;
const VIEWPORT_HEIGHT = 400;

/**
 * Row component. In react-window v2, data is passed via rowProps
 * and spread directly into this component's props (no `data` wrapper).
 */
const JsonRow = ({ index, style, rows }) => {
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
};

export default function JsonPreview({
  rows = [],
  fileName,
  fileSizeMB,
}) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="preview-card">
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

      <div className="json-preview-wrapper">
        <List
          rowComponent={JsonRow}
          rowCount={rows.length}
          rowHeight={ROW_HEIGHT}
          rowProps={{ rows }}
          style={{ height: VIEWPORT_HEIGHT }}
          overscanCount={3}
        />
      </div>
    </div>
  );
}