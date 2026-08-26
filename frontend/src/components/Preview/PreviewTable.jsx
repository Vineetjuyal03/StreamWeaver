import React from 'react';
import { List } from 'react-window';
import './PreviewTable.css';

const ROW_HEIGHT = 40;
const VIEWPORT_HEIGHT = 400;
const COLUMN_WIDTH = 180;
const INDEX_WIDTH = 60;

function VirtualRow({
  index,
  style,
  rows,
  headers,
  totalWidth,
}) {
  const rowData = rows[index];

  return (
    <div
      style={{
        ...style,
        width: totalWidth,
      }}
      className={`virtual-row ${index % 2 === 0 ? 'even' : 'odd'}`}
    >
      <div
        className="virtual-cell cell-index"
        style={{ width: INDEX_WIDTH }}
      >
        {index + 1}
      </div>

      {headers.map((header) => (
        <div
          key={header}
          className="virtual-cell"
          style={{ width: COLUMN_WIDTH }}
          title={String(rowData?.[header] ?? '')}
        >
          <span className="cell-content">
            {String(rowData?.[header] ?? '')}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PreviewTable({
  headers = [],
  rows = [],
  fileName,
  fileSizeMB,
}) {
  if (!rows.length || !headers.length) {
    return null;
  }

  const totalWidth =
    INDEX_WIDTH + headers.length * COLUMN_WIDTH;

  return (
    <div className="preview-card">

      {/* Header */}
      <div className="preview-header">
        <div>
          <h3 className="preview-title">
            Sample Data Preview
          </h3>

          <p className="preview-meta">
            Showing first{' '}
            <strong>{rows.length}</strong> rows from{' '}
            <code>{fileName}</code>

            {fileSizeMB != null && (
              <> ({fileSizeMB} MB)</>
            )}
          </p>
        </div>

        <div className="column-badge">
          {headers.length} Columns Detected
        </div>
      </div>

      {/* Horizontal scrolling container */}
      <div className="virtual-table-wrapper">

        <div
          className="virtual-table"
          style={{ width: totalWidth }}
        >

          {/* Header */}
          <div
            className="virtual-header-row"
            style={{ width: totalWidth }}
          >
            <div
              className="virtual-header-cell cell-index"
              style={{ width: INDEX_WIDTH }}
            >
              #
            </div>

            {headers.map((header) => (
              <div
                key={header}
                className="virtual-header-cell"
                style={{ width: COLUMN_WIDTH }}
              >
                {header}
              </div>
            ))}
          </div>

          {/* Virtualized rows */}
          <List
            rowComponent={VirtualRow}
            rowCount={rows.length}
            rowHeight={ROW_HEIGHT}
            rowProps={{
              rows,
              headers,
              totalWidth,
            }}
            overscanCount={5}
            style={{
              height: VIEWPORT_HEIGHT,
              width: totalWidth,
            }}
          />

        </div>
      </div>
    </div>
  );
}