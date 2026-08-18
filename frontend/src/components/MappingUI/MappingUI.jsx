import React from 'react';
import './MappingUI.css';

export default function MappingUI({
  headers,
  destinationFields,
  mapping,
  onMappingChange,
}) {
  if (!headers || headers.length === 0) {
    return null;
  }

  const handleChange = (sourceColumn, destinationField) => {
    onMappingChange(sourceColumn, destinationField);
  };

  return (
    <section className="mapping-section">
      <div className="mapping-header">
        <div>
          <h2>Map Your Data</h2>
          <p>
            Map each source column to a field in the destination collection.
          </p>
        </div>

        <div className="mapping-count">
          {headers.length} Source Columns
        </div>
      </div>

      <div className="mapping-table">

        {/* Header */}
        <div className="mapping-row mapping-header-row">
          <div>Source Column</div>
          <div>Destination Field</div>
        </div>

        {/* Mapping rows */}
        {headers.map((header) => (
          <div className="mapping-row" key={header}>

            <div className="source-column">
              <span className="source-column-name">
                {header}
              </span>
            </div>

            <div className="destination-column">
              <select
                value={mapping[header] || ''}
                onChange={(e) =>
                  handleChange(header, e.target.value)
                }
              >
                <option value="">
                  -- Don't import --
                </option>

                {destinationFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

          </div>
        ))}

      </div>
    </section>
  );
}