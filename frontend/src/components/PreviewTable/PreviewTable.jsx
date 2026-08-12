import React from 'react';
import { FixedSizeList as List } from 'react-window';
import './PreviewTable.css';

export default function PreviewTable({ headers, rows, fileName, fileSizeMB }) {
  // Console log to verify components and state
  console.log('🔍 PreviewTable Loaded:', {
    headersCount: headers?.length,
    rowsCount: rows?.length,
    isListAvailable: Boolean(List),
  });

  if (!rows || rows.length === 0) return null;

  // Layout metrics for virtualization
  const ROW_HEIGHT = 40;
  const VIEWPORT_HEIGHT = 400; 
  const COLUMN_WIDTH = 180;    
  const INDEX_WIDTH = 60;      
  const TOTAL_WIDTH = INDEX_WIDTH + headers.length * COLUMN_WIDTH;

  // Render function for visible virtual rows
  const Row = ({ index, style }) => {
    const rowData = rows[index];

    return (
      <div
        style={{ ...style, width: TOTAL_WIDTH }}
        className={`virtual-row ${index % 2 === 0 ? 'even' : 'odd'}`}
      >
        <div className="virtual-cell cell-index">{index + 1}</div>
        {headers.map((header) => (
          <div key={header} className="virtual-cell" title={String(rowData[header] ?? '')}>
            {String(rowData[header] ?? '')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="preview-card">
      <div className="preview-header">
        <div>
          <h3 className="preview-title">Sample Data Preview (Virtualized)</h3>
          <p className="preview-meta">
            Showing first <strong>{rows.length}</strong> rows from <code>{fileName}</code> ({fileSizeMB} MB)
          </p>
        </div>
        <div className="column-badge">{headers.length} Columns Detected</div>
      </div>

      {/* Horizontal & Vertical Scroll Outer Container */}
      <div className="virtual-table-wrapper">
        <div style={{ width: TOTAL_WIDTH }}>
          
          {/* Sticky Column Headers */}
          <div className="virtual-header-row">
            <div className="virtual-header-cell cell-index">#</div>
            {headers.map((header) => (
              <div key={header} className="virtual-header-cell">
                {header}
              </div>
            ))}
          </div>

          {/* Virtualized Rows List */}
          {List ? (
            <List
              height={VIEWPORT_HEIGHT}
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              width={TOTAL_WIDTH}
            >
              {Row}
            </List>
          ) : (
            <div style={{ padding: '20px', color: '#dc2626', textAlign: 'center' }}>
              ⚠️ Unable to load react-window list component.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}