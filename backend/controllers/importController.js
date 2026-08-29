const Busboy = require("busboy");
const csv = require("csv-parser");
const { Transform } = require("stream");

const createMappingStream = require("../streams/cleanRowStream");
const createMongoBatchStream = require("../streams/mongoBatchStream");
const createCustomTransformStream = require("../streams/customTransformStream");

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

    const importId = `import_${Date.now()}`;
    startImport(importId);

    console.log(`[${requestTag}] importId=${importId}`);

    // =====================================
    // FORM DATA
    // =====================================

    busboy.on("field", (fieldname, value) => {
        console.log(`[${requestTag}] FIELD RECEIVED: ${fieldname}`);

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
    });


    // =====================================
    // FILE
    // =====================================

    busboy.on("file", (fieldname, file, info) => {
        fileStarted = true;
        console.log(`[${requestTag}] FILE RECEIVED: ${info.filename}`);

        if (mappingError) {
            // A mapping error already sent a response above — just drain and exit.
            file.resume();
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
        const mongoBatchStream = createMongoBatchStream(importId);

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
                    message: `Pipeline failed at ${stageName}`,
                    error: error.message,
                    rowsProcessedBeforeFailure: rowCount,
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


const getImportStatus = (req, res) => {
    try {
        const { importId } = req.params;

        if (!importId) {
            return res.status(400).json({
                success: false,
                message: "importId is required"
            });
        }

        const progress = getProgress(importId);

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: "Import not found",
                importId
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                importId,
                status: progress.status,
                rowsProcessed: progress.rowsProcessed,
                rowsPerSecond: progress.rowsPerSecond
            }
        });

    } catch (error) {
        console.error("GET IMPORT STATUS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get import status",
            error: error.message
        });
    }
};


module.exports = {
    uploadCSV,
    getImportStatus
};