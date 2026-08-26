import React from 'react';
import PreviewTable from './PreviewTable';
import JsonPreview from './JsonPreview';

export default function DataPreview({
  fileType,
  headers,
  rows,
  fileName,
  fileSizeMB,
}) {
  if (!rows || rows.length === 0) return null;

  if (fileType === 'json') {
    return (
      <JsonPreview
        rows={rows}
        fileName={fileName}
        fileSizeMB={fileSizeMB}
      />
    );
  }

  return (
    <PreviewTable
      headers={headers}
      rows={rows}
      fileName={fileName}
      fileSizeMB={fileSizeMB}
    />
  );
}