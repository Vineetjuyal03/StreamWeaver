import React, { useEffect, useState } from 'react';
import DropZone from './components/DropZone/DropZone';
import PreviewTable from './components/PreviewTable/PreviewTable';
import MappingUI from './components/MappingUI/MappingUI';
import { parseFilePreview } from './utils/fileParser';
import {
    fetchCollections,
    fetchCollectionFields,
} from './services/api';
import './App.css';

export default function App() {
    // -----------------------------
    // File / Preview state
    // -----------------------------
    const [fileInfo, setFileInfo] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // -----------------------------
    // MongoDB collection state
    // -----------------------------
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [collectionsError, setCollectionsError] = useState('');

    // -----------------------------
    // Destination fields state
    // -----------------------------
    const [destinationFields, setDestinationFields] = useState([]);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [fieldsError, setFieldsError] = useState('');

    // -----------------------------
    // Mapping state
    // -----------------------------
    const [mapping, setMapping] = useState({});

    // -----------------------------
    // Fetch collections on app load
    // -----------------------------
    useEffect(() => {
        const loadCollections = async () => {
            try {
                setCollectionsLoading(true);
                setCollectionsError('');

                const data = await fetchCollections();

                setCollections(data);
            } catch (err) {
                console.error('Failed to load collections:', err);

                setCollectionsError(
                    err.response?.data?.message ||
                    'Failed to load database collections.'
                );
            } finally {
                setCollectionsLoading(false);
            }
        };

        loadCollections();
    }, []);

    // -----------------------------
    // Fetch fields of selected collection
    // -----------------------------
    const loadCollectionFields = async (collectionName) => {
        if (!collectionName) {
            setDestinationFields([]);
            setMapping({});
            return;
        }

        try {
            setFieldsLoading(true);
            setFieldsError('');

            // Clear old collection's fields while loading
            setDestinationFields([]);
            setMapping({});

            const fields = await fetchCollectionFields(collectionName);

            setDestinationFields(fields);
        } catch (err) {
            console.error(
                `Failed to load fields for collection "${collectionName}":`,
                err
            );

            setFieldsError(
                err.response?.data?.message ||
                `Failed to load fields for "${collectionName}".`
            );

            setDestinationFields([]);
        } finally {
            setFieldsLoading(false);
        }
    };

    // -----------------------------
    // Collection selection handler
    // -----------------------------
    const handleCollectionChange = async (e) => {
        const collectionName = e.target.value;

        setSelectedCollection(collectionName);

        // Fetch fields belonging to the newly selected collection
        await loadCollectionFields(collectionName);
    };

    // -----------------------------
    // File selection handler
    // -----------------------------
    const handleFileSelect = async (selectedFile) => {
        setError('');
        setLoading(true);
        setPreviewRows([]);
        setHeaders([]);

        try {
            const result = await parseFilePreview(selectedFile, 1000);

            setFileInfo({
                name: result.fileName,
                sizeMB: result.fileSizeMB,
                rawFile: selectedFile,
            });

            setHeaders(result.headers);
            setPreviewRows(result.rows);
        } catch (err) {
            setError(err.message || 'Error processing file preview.');
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Mapping change handler
    // -----------------------------
    const handleMappingChange = (sourceColumn, destinationField) => {
        setMapping((previousMapping) => ({
            ...previousMapping,
            [sourceColumn]: destinationField,
        }));
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">StreamWeaver</h1>

                <p className="app-subtitle">
                    High-Throughput No-Code ETL Pipeline
                </p>
            </header>

            <main className="app-main">

                {/* -------------------------------- */}
                {/* Database Collection Selection    */}
                {/* -------------------------------- */}
                <section className="collection-section">
                    <div className="collection-header">
                        <h2>Select Destination Collection</h2>

                        <p>
                            Choose the MongoDB collection where your data
                            will be imported.
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
                        <select
                            className="collection-select"
                            value={selectedCollection}
                            onChange={handleCollectionChange}
                        >
                            <option value="">
                                -- Select a collection --
                            </option>

                            {collections.map((collection) => (
                                <option
                                    key={collection}
                                    value={collection}
                                >
                                    {collection}
                                </option>
                            ))}
                        </select>
                    )}

                    {selectedCollection && (
                        <div className="selected-collection">
                            Destination:{' '}
                            <strong>{selectedCollection}</strong>
                        </div>
                    )}

                    {/* Collection fields loading */}
                    {fieldsLoading && (
                        <div className="status-banner loading">
                            🔄 Loading collection fields...
                        </div>
                    )}

                    {/* Collection fields error */}
                    {fieldsError && (
                        <div className="status-banner error">
                            {fieldsError}
                        </div>
                    )}
                </section>

                {/* -------------------------------- */}
                {/* Step 1: File Upload              */}
                {/* -------------------------------- */}
                <DropZone
                    onFileSelect={handleFileSelect}
                    disabled={loading}
                />

                {/* -------------------------------- */}
                {/* File Parsing Loading             */}
                {/* -------------------------------- */}
                {loading && (
                    <div className="status-banner loading">
                        ⚡ Parsing first 1,000 rows in memory...
                    </div>
                )}

                {/* -------------------------------- */}
                {/* File Error                       */}
                {/* -------------------------------- */}
                {error && (
                    <div className="status-banner error">
                        {error}
                    </div>
                )}

                {/* -------------------------------- */}
                {/* Step 2: Preview                  */}
                {/* -------------------------------- */}
                {previewRows.length > 0 && (
                    <PreviewTable
                        headers={headers}
                        rows={previewRows}
                        fileName={fileInfo?.name}
                        fileSizeMB={fileInfo?.sizeMB}
                    />
                )}

                {/* -------------------------------- */}
                {/* Step 3: Mapping                  */}
                {/* -------------------------------- */}
                {previewRows.length > 0 &&
                    selectedCollection &&
                    !fieldsLoading &&
                    destinationFields.length > 0 && (
                        <MappingUI
                            headers={headers}
                            destinationFields={destinationFields}
                            mapping={mapping}
                            onMappingChange={handleMappingChange}
                        />
                    )}

            </main>
        </div>
    );
}