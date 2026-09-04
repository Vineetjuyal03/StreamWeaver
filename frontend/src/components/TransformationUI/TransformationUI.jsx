import React from 'react';
import './TransformationUI.css';

const EXAMPLE_PLACEHOLDER = '(value) => value.toUpperCase()';

export default function TransformationUI({ mapping, transformations, onTransformationChange }) {
    // Only columns that have actually been mapped to a destination are eligible
    const destinationColumns = [...new Set(Object.values(mapping).filter(Boolean))];

    if (destinationColumns.length === 0) {
        return null;
    }

    const getTransformationFor = (column) =>
        transformations.find((t) => t.column === column);

    const handleToggle = (column, enabled) => {
        if (enabled) {
            onTransformationChange(column, EXAMPLE_PLACEHOLDER);
        } else {
            onTransformationChange(column, null); // null signals "remove"
        }
    };

    const handleCodeChange = (column, code) => {
        onTransformationChange(column, code);
    };

    return (
        <div className="transformation-ui">
            <h3 className="transformation-title">Custom Transformations</h3>
            <p className="transformation-subtitle">
                Optional — write a JavaScript function to transform a column's value.
                Runs in a secure, isolated sandbox on the server.
            </p>

            {destinationColumns.map((column) => {
                const existing = getTransformationFor(column);
                const enabled = Boolean(existing);

                return (
                    <div key={column} className="transformation-row">
                        <label className="transformation-toggle">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => handleToggle(column, e.target.checked)}
                            />
                            <span className="transformation-column-name">{column}</span>
                        </label>

                        {enabled && (
                            <div className="transformation-editor">
                                <textarea
                                    className="transformation-textarea"
                                    value={existing.code}
                                    onChange={(e) => handleCodeChange(column, e.target.value)}
                                    placeholder={EXAMPLE_PLACEHOLDER}
                                    spellCheck={false}
                                    rows={3}
                                />
                                <p className="transformation-hint">
                                    Function receives the column's value and must return the transformed result.
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}