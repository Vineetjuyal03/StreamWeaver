import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import CollectionSelector from './components/CollectionSelector/CollectionSelector';
import DropZone from './components/DropZone/DropZone';
import Preview from './components/Preview/Preview';
import MappingUI from './components/MappingUI/MappingUI';
import UploadButton from './components/UploadButton/UploadButton';
import { parseFileStream } from './utils/fileParser';
import {
    fetchCollections,
    fetchCollectionFields,
    uploadCSV,
    uploadJSON
} from './services/api';
import './App.css';

export default function App() {
    // File / Preview state
    const [fileInfo, setFileInfo] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // MongoDB collection state
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [collectionsError, setCollectionsError] = useState('');

    // Destination fields state
    const [destinationFields, setDestinationFields] = useState([]);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [fieldsError, setFieldsError] = useState('');

    // Mapping state
    const [mapping, setMapping] = useState({});

    const [uploadStatus, setUploadStatus] = useState(null); // { state: 'uploading' | 'success' | 'error', message, rowsInserted }

    const handleUpload = async () => {
    if (!fileInfo?.rawFile) {
        setUploadStatus({ state: 'error', message: 'No file selected.' });
        return;
    }
    if (!mapping || Object.keys(mapping).length === 0) {
        setUploadStatus({ state: 'error', message: 'Please map at least one column first.' });
        return;
    }

    setUploadStatus({ state: 'uploading' });

    try {
        const uploadFn = fileInfo.type === 'json' ? uploadJSON : uploadCSV;
        const result = await uploadFn(fileInfo.rawFile, mapping, []);
        setUploadStatus({
            state: 'success',
            message: result.message,
            rowsInserted: result.rowsInserted,
        });
    } catch (err) {
        setUploadStatus({ state: 'error', message: err.message || 'Upload failed.' });
    }
};

    // Fetch collections on app load
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
                    err.response?.data?.message || 'Failed to load database collections.'
                );
            } finally {
                setCollectionsLoading(false);
            }
        };

        loadCollections();
    }, []);

    // Fetch fields of selected collection
    const loadCollectionFields = async (collectionName) => {
        if (!collectionName) {
            setDestinationFields([]);
            setMapping({});
            return;
        }

        try {
            setFieldsLoading(true);
            setFieldsError('');
            setDestinationFields([]);
            setMapping({});

            const fields = await fetchCollectionFields(collectionName);
            setDestinationFields(fields);
        } catch (err) {
            console.error(`Failed to load fields for collection "${collectionName}":`, err);
            setDestinationFields([]);
        } finally {
            setFieldsLoading(false);
        }
    };

    const handleCollectionChange = async (e) => {
        const collectionName = e.target.value;
        setSelectedCollection(collectionName);

        if (collections.includes(collectionName)) {
            await loadCollectionFields(collectionName);
        } else {
            setDestinationFields([]);
            setFieldsError('');
            setMapping({});
        }
    };

    const handleFileSelect = async (selectedFile) => {
        setError('');
        setLoading(true);
        setPreviewRows([]);
        setHeaders([]);

        try {
            // Parses up to 1000 rows/objects using streams and auto-detects CSV or JSON
            const result = await parseFileStream(selectedFile, 1000);
            console.log(result)
            setFileInfo({
                name: result.fileName,
                sizeMB: result.fileSizeMB,
                type: result.type,
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

    const handleMappingChange = (sourceColumn, destinationField) => {
        setMapping((prev) => ({
            ...prev,
            [sourceColumn]: destinationField,
        }));
    };

    const handleTest = async () => {
        const resp = await test();
        console.log(resp);
    };

    return (
        <div className="app-container">
            <Header />

            <main className="app-main">
                <CollectionSelector
                    collections={collections}
                    selectedCollection={selectedCollection}
                    collectionsLoading={collectionsLoading}
                    collectionsError={collectionsError}
                    fieldsLoading={fieldsLoading}
                    fieldsError={fieldsError}
                    onCollectionChange={handleCollectionChange}
                />

                <DropZone onFileSelect={handleFileSelect} disabled={loading} />

                {loading && (
                    <div className="status-banner loading">
                        ⚡ Parsing first 1,000 items in memory...
                    </div>
                )}

                {error && (
                    <div className="status-banner error">
                        {error}
                    </div>
                )}

                {previewRows.length > 0 && (
                    <Preview
                        fileType={fileInfo?.type}
                        headers={headers}
                        rows={previewRows}
                        fileName={fileInfo?.name}
                        fileSizeMB={fileInfo?.sizeMB}
                    />
                )}

                {previewRows.length > 0 && selectedCollection && !fieldsLoading && (
                    <MappingUI
                        headers={headers}
                        destinationFields={destinationFields}
                        mapping={mapping}
                        onMappingChange={handleMappingChange}
                    />
                )}
                {previewRows.length > 0 && Object.keys(mapping).length > 0 && (
                    <UploadButton
                        onUpload={handleUpload}
                        disabled={uploadStatus?.state === 'uploading'}
                        status={uploadStatus}
                    />
                )}
            </main>
        </div>
    );
}