import React from 'react';
import './CollectionSelector.css';

export default function CollectionSelector({
    collections,
    selectedCollection,
    collectionsLoading,
    collectionsError,
    fieldsLoading,
    fieldsError,
    onCollectionChange,
}) {
    return (
        <section className="collection-section">
            <div className="collection-header">
                <h2>Destination Collection</h2>
                <p>
                    Select an existing MongoDB collection or enter a new collection name.
                </p>
            </div>

            {collectionsLoading ? (
                <div className="status-banner loading">
                    🔄 Loading database collections...
                </div>
            ) : collectionsError ? (
                <div className="status-banner error">
                    {collectionsError}
                </div>
            ) : (
                <>
                    <input
                        className="collection-input"
                        type="text"
                        list="collections"
                        value={selectedCollection}
                        onChange={onCollectionChange}
                        placeholder="Select or enter collection name"
                    />

                    <datalist id="collections">
                        {collections.map((collection) => (
                            <option key={collection} value={collection} />
                        ))}
                    </datalist>
                </>
            )}

            {selectedCollection && (
                <div className="selected-collection">
                    Destination: <strong>{selectedCollection}</strong>
                    {!collections.includes(selectedCollection) && (
                        <span> (New collection)</span>
                    )}
                </div>
            )}

            {fieldsLoading && (
                <div className="status-banner loading">
                    🔄 Loading existing fields as suggestions...
                </div>
            )}

            {fieldsError && (
                <div className="status-banner error">
                    {fieldsError}
                </div>
            )}
        </section>
    );
}