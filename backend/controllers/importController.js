const Busboy = require("busboy");
const csv = require("csv-parser");
const { Transform } = require("stream");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const createMappingStream = require("../streams/cleanRowStream");
const createMongoBatchStream = require("../streams/mongoBatchStream");
const createCustomTransformStream = require("../streams/customTransformStream");
const { Readable } = require("stream");
const { sendProgress } = require("../websocket/progressServer");

const {
    startImport,
    updateProgress,
    completeImport,
    getProgress
} = require("../utils/importProgress");


const uploadCSV = (req, res) => {
    const requestTag = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log(`[${requestTag}] CSV UPLOAD STARTED`);

    const busboy = Busboy({
        headers: req.headers
    });

        let mapping = null;
    let mappingReceived = false;
    let mappingError = false;
    let transformations = [];
    let fileStarted = false;
    let importId = null;
    let collectionName = null;
    // =====================================
    // FORM DATA
    // =====================================

    busboy.on("field", (fieldname, value) => {
        console.log(`[${requestTag}] FIELD RECEIVED: ${fieldname}`);
        if (fieldname === "collection") {
            if (!value || value.trim() === "") {
                console.error(`[${requestTag}] Collection name is empty`);
                if (!res.headersSent) {
                    return res.status(400).json({
                        success: false,
                        message: "Collection name is required",
                    });
                }
                return;
            }
            collectionName = value;
        }
        if (fieldname === "mapping") {
            mappingReceived = true;

            if (!value || value.trim() === "") {
                mappingError = true;
                console.error(`[${requestTag}] Mapping is empty`);
                if (!res.headersSent) {
                    return res.status(400).json({
                        success: false,
                        message: "Mapping is empty",
                    });
                }
                return;
            }

            try {
                mapping = JSON.parse(value);

                if (
                    typeof mapping !== "object" ||
                    mapping === null ||
                    Array.isArray(mapping)
                ) {
                    mappingError = true;
                    mapping = null;
                    console.error(`[${requestTag}] Mapping is not a valid object`);
                    if (!res.headersSent) {
                        return res.status(400).json({
                            success: false,
                            message: "Mapping must be a valid object",
                        });
                    }
                    return;
                }

                if (Object.keys(mapping).length === 0) {
                    mappingError = true;
                    mapping = null;
                    console.error(`[${requestTag}] Mapping object is empty`);
                    if (!res.headersSent) {
                        return res.status(400).json({
                            success: false,
                            message: "Mapping cannot be empty",
                        });
                    }
                    return;
                }

                console.log(`[${requestTag}] PARSED MAPPING:`, mapping);

            } catch (error) {
                mappingError = true;
                mapping = null;
                console.error(`[${requestTag}] Mapping JSON parse error:`, error.message);
                if (!res.headersSent) {
                    return res.status(400).json({
                        success: false,
                        message: "Mapping error",
                    });
                }
                return;
            }
        }

        if (fieldname === "transformations") {
            try {
                transformations = JSON.parse(value);
                console.log(`[${requestTag}] PARSED TRANSFORMATIONS:`, transformations);
            } catch (error) {
                console.error(`[${requestTag}] Transformation JSON error:`, error.message);
            }
        }
        if (fieldname === "importId") {
            importId = value;
            console.log(`[${requestTag}] Received importId from client: ${importId}`);
        }
    });


    // =====================================
    // FILE
    // =====================================

    busboy.on("file", (fieldname, file, info) => {
        fileStarted = true;

        if (!importId) {
            importId = `import_${Date.now()}`;
        }
        startImport(importId);

        console.log(`[${requestTag}] FILE RECEIVED: ${info.filename}, importId=${importId}`);
        if (mappingError) {
            // A mapping error already sent a response above — just drain and exit.
            file.resume();
            return;
        }
        if (!collectionName) {
            console.error(`[${requestTag}] Collection has not been received yet.`);
            file.resume();
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: "Target collection must be sent before the file",
                });
            }
            return;
        }

        if (!mapping) {
            console.error(`[${requestTag}] Mapping has not been received yet.`);
            file.resume();
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: "Mapping must be sent before the file",
                });
            }
            return;
        }

        console.log(`[${requestTag}] Creating pipeline (mapping + transformations: ${transformations.length})`);

        const mappingStream = createMappingStream(mapping);
        const customTransformStream = createCustomTransformStream(transformations);
        const mongoBatchStream = createMongoBatchStream(importId, collectionName);

        let rowCount = 0;

        const counterStream = new Transform({
            objectMode: true,
            transform(row, encoding, callback) {
                rowCount++;
                updateProgress(importId, 1);

                if (rowCount % 1000 === 0) {
                    const progress = getProgress(importId);
                    sendProgress(importId, {
                        rowsProcessed: progress.rowsProcessed,
                        rowsPerSecond: progress.rowsPerSecond,
                        status: "processing"
                    });
                }

                callback(null, row);
            }
        });

        // ---- error listeners on EVERY stream in the chain ----
        // Without these, an error thrown inside mappingStream or
        // customTransformStream has no listener and can silently
        // kill the pipeline with no response ever sent to the client.

        const handlePipelineError = (stageName) => (error) => {
            console.error(`[${requestTag}] ${stageName} ERROR at row ~${rowCount}:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: `Pipeline failed at ${stageName}: ${error.message}`,
                });
            }
        };

        mappingStream.on("error", handlePipelineError("mappingStream"));
        customTransformStream.on("error", handlePipelineError("customTransformStream"));
        counterStream.on("error", handlePipelineError("counterStream"));

        mongoBatchStream.on("finish", () => {
            completeImport(importId);

            const progress = getProgress(importId);
            console.log(`[${requestTag}] MONGODB INSERTION COMPLETED. Total rows: ${rowCount}`);

            sendProgress(importId, {
                rowsProcessed: progress.rowsProcessed,
                rowsPerSecond: progress.rowsPerSecond,
                status: "completed"
            });

            if (!res.headersSent) {
                return res.status(200).json({
                    success: true,
                    message: "CSV imported successfully",
                    importId,
                    rowsInserted: rowCount,
                    rowsPerSecond: progress.rowsPerSecond,
                    status: "completed"
                });
            }
        });

        mongoBatchStream.on("error", handlePipelineError("mongoBatchStream"));

        console.log(`[${requestTag}] Starting CSV pipeline...`);

        file
            .pipe(csv())
            .pipe(mappingStream)
            .pipe(customTransformStream)
            .pipe(counterStream)
            .pipe(mongoBatchStream);
    });

    // =====================================
    // BUSBOY ERROR
    // =====================================

    busboy.on("error", (error) => {
        console.error(`[${requestTag}] BUSBOY ERROR:`, error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Upload failed",
                error: error.message
            });
        }
    });

    busboy.on("finish", () => {
        if (!fileStarted && !res.headersSent) {
            console.error(`[${requestTag}] No file was received in this request.`);
            res.status(400).json({
                success: false,
                message: "No file was uploaded",
            });
        }
    });

    req.pipe(busboy);
};


const getImportStatus = asyncHandler(async (req, res) => {
    const { importId } = req.params;

    if (!importId) {
        throw new AppError("importId is required", 400);
    }

    const progress = getProgress(importId);

    if (!progress) {
        throw new AppError("Import not found", 404);
    }

    res.status(200).json({
        success: true,
        data: {
            importId,
            status: progress.status,
            rowsProcessed: progress.rowsProcessed,
            rowsPerSecond: progress.rowsPerSecond,
        },
    });
});


const uploadJSON = (req, res) => {
    const requestTag = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log(`[${requestTag}] JSON UPLOAD STARTED`);

    const busboy = Busboy({ headers: req.headers });

    let mapping = null;
    let mappingError = false;
    let transformations = [];
    let fileStarted = false;
    let importId = null;
    let collectionName = null;

    busboy.on("field", (fieldname, value) => {
        if (fieldname === "collection") {
            if (!value || !value.trim()) {
                if (!res.headersSent) return res.status(400).json({ success: false, message: "Collection name is required" });
                return;
            }
            collectionName = value;
        }
        if (fieldname === "mapping") {
            try {
                mapping = JSON.parse(value);
                if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping) || Object.keys(mapping).length === 0) {
                    mappingError = true;
                    mapping = null;
                }
            } catch (e) {
                mappingError = true;
            }
            if (mappingError && !res.headersSent) {
                return res.status(400).json({ success: false, message: "Mapping must be a valid, non-empty object" });
            }
        }
        if (fieldname === "transformations") {
            try { transformations = JSON.parse(value); } catch (e) { console.error(`[${requestTag}] Bad transformations JSON:`, e.message); }
        }
        if (fieldname === "importId") importId = value;
    });

    busboy.on("file", (fieldname, file) => {
        fileStarted = true;
        if (!importId) importId = `import_${Date.now()}`;
        startImport(importId);

        if (mappingError) { file.resume(); return; }
        if (!collectionName || !mapping) {
            file.resume();
            if (!res.headersSent) {
                return res.status(400).json({ success: false, message: "Collection and mapping must be sent before the file" });
            }
            return;
        }

        // JSON needs the full document before it can be parsed safely,
        // so buffer this file's bytes (unlike CSV, which streams row by row).
        const chunks = [];
        file.on("data", (chunk) => chunks.push(chunk));

        file.on("end", () => {
            let parsed;
            try {
                parsed = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            } catch (err) {
                console.error(`[${requestTag}] Invalid JSON:`, err.message);
                if (!res.headersSent) {
                    return res.status(400).json({ success: false, message: `Invalid JSON file: ${err.message}` });
                }
                return;
            }

            // Handles both a real array [ {...}, {...} ] and an
            // object-of-objects like { "0": {...}, "1": {...} }.
            const records = Array.isArray(parsed) ? parsed : Object.values(parsed);

            if (!records.length) {
                if (!res.headersSent) {
                    return res.status(400).json({ success: false, message: "JSON file contained no records" });
                }
                return;
            }

            const mappingStream = createMappingStream(mapping);
            const customTransformStream = createCustomTransformStream(transformations);
            const mongoBatchStream = createMongoBatchStream(importId, collectionName);

            let rowCount = 0;
            const counterStream = new Transform({
                objectMode: true,
                transform(row, encoding, callback) {
                    rowCount++;
                    updateProgress(importId, 1);
                    if (rowCount % 1000 === 0) {
                        const progress = getProgress(importId);
                        sendProgress(importId, { rowsProcessed: progress.rowsProcessed, rowsPerSecond: progress.rowsPerSecond, status: "processing" });
                    }
                    callback(null, row);
                }
            });

            const handlePipelineError = (stageName) => (error) => {
                console.error(`[${requestTag}] ${stageName} ERROR at row ~${rowCount}:`, error);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: `Pipeline failed at ${stageName}: ${error.message}` });
                }
            };

            mappingStream.on("error", handlePipelineError("mappingStream"));
            customTransformStream.on("error", handlePipelineError("customTransformStream"));
            counterStream.on("error", handlePipelineError("counterStream"));

            mongoBatchStream.on("finish", () => {
                completeImport(importId);
                const progress = getProgress(importId);
                console.log(`[${requestTag}] MONGODB INSERTION COMPLETED. Total rows: ${rowCount}`);
                sendProgress(importId, { rowsProcessed: progress.rowsProcessed, rowsPerSecond: progress.rowsPerSecond, status: "completed" });
                if (!res.headersSent) {
                    return res.status(200).json({
                        success: true,
                        message: "JSON imported successfully",
                        importId,
                        rowsInserted: rowCount,
                        rowsPerSecond: progress.rowsPerSecond,
                        status: "completed"
                    });
                }
            });
            mongoBatchStream.on("error", handlePipelineError("mongoBatchStream"));

            Readable.from(records, { objectMode: true })
                .pipe(mappingStream)
                .pipe(customTransformStream)
                .pipe(counterStream)
                .pipe(mongoBatchStream);
        });
    });

    busboy.on("error", (error) => {
        console.error(`[${requestTag}] BUSBOY ERROR:`, error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Upload failed", error: error.message });
        }
    });

    busboy.on("finish", () => {
        if (!fileStarted && !res.headersSent) {
            res.status(400).json({ success: false, message: "No file was uploaded" });
        }
    });

    req.pipe(busboy);
};

module.exports = {
    uploadCSV,
    uploadJSON,
    getImportStatus
};
//importController.js