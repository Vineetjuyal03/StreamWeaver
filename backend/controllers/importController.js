const Busboy = require("busboy");
const csv = require("csv-parser");
const { Transform } = require("stream");

const createMappingStream =
    require("../streams/cleanRowStream");

const createMongoBatchStream =
    require("../streams/mongoBatchStream");

const createCustomTransformStream =
    require("../streams/customTransformStream");

const { sendProgress } = require("../websocket/progressServer");

const {
    startImport,
    updateProgress,
    completeImport,
    getProgress
} = require("../utils/importProgress");


const uploadCSV = (req, res) => {
    console.log("CSV UPLOAD STARTED");
    const busboy = Busboy({
        headers: req.headers
    });

    let mapping = null;
    let transformations = [];
    // IMPORTANT
    // let fileReceived = false;

    // let mappingReceived = false;
    // let mappingError = false;

    const importId = `import_${Date.now()}`;
    startImport(importId);

    // =====================================
    // FORM DATA
    // =====================================

    busboy.on("field", (fieldname, value) => {
        console.log("FIELD RECEIVED:");

        if (fieldname === "mapping") {
            mappingReceived = true;
            // Check empty mapping
            if (!value || value.trim() === "") {
                mappingError = true
                return res.status(404).json({
                    success: false,
                    message: "Mapping is empty",
                });
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
                     return res.status(400).json({

                    success: false,
                    message: "Mapping must be a valid object",
                });
                }
                // Check empty object

                if (
                    Object.keys(mapping).length === 0
                ) {

                    mappingError = true;
                    mapping = null;
                    console.log("PARSED MAPPING:",mapping);
                    return res.status(400).json({
                    success: false,
                    message: "Mapping cannot be empty",
                });

                }
                

            } catch (error) {
                mappingError = true;
                mapping = null;                
                return res.status(400).json({
                    // success: false,
                    message: "Mapping error",
                });
            }
        }

        if (fieldname === "transformations") {
            try {
                transformations = JSON.parse(value);
                console.log(
                    "PARSED TRANSFORMATIONS:",
                    transformations
                );
                // return res.status(201).json({
                //     success: true,
                //     message: "PARSED TRANSFORMATIONS:",
                // });

            } catch (error) {

                console.error(
                    "Transformation JSON error:",
                    error.message
                );
            }
        }

    });


    // =====================================
    // FILE
    // =====================================

    busboy.on("file", (fieldname, file, info) => {
        fileStarted = true;
        console.log("FILE RECEIVED");
        console.log("Field name:", fieldname);
        console.log("Filename:", info.filename);

        if (!mapping) {
            console.error(
                "Mapping has not been received yet."
            );

            file.resume();

            return;
        }


        console.log("Creating mapping stream...");

        const mappingStream =
            createMappingStream(mapping);
        console.log("Transformations received:",transformations);

        const customTransformStream =
            createCustomTransformStream(
                transformations
            );


        let rowCount = 0;

        const counterStream = new Transform({

    objectMode: true,

    transform(row, encoding, callback) {

        rowCount++;

        updateProgress(
            importId,
            1
        );


        if (rowCount % 1000 === 0) {
            const progress =
                getProgress(importId);
            console.log("Sending progress for row:",rowCount);
            sendProgress(
                importId,
                {
                    rowsProcessed:
                        progress.rowsProcessed,

                    rowsPerSecond:
                        progress.rowsPerSecond,
                    status: "processing"
                }
            );

        }
        callback(null, row);
    }

});

        const mongoBatchStream =
            createMongoBatchStream(importId);

        mongoBatchStream.on("finish", () => {
            completeImport(importId);
            console.log("MONGODB INSERTION COMPLETED");

            console.log("Total rows:",rowCount);
            const progress = getProgress(importId);
            sendProgress(importId,
                {
                    rowsProcessed:progress.rowsProcessed,
                    rowsPerSecond:progress.rowsPerSecond,
                    status:"completed"
                }
            );

            console.log(
                "Rows/sec:",
                progress.rowsPerSecond
            );

            if (!res.headersSent) {
                return res.status(200).json({
                    success: true,
                    message: "CSV imported successfully",
                    importId,
                    rowsInserted:rowCount,
                    rowsPerSecond:progress.rowsPerSecond,
                    status:"completed"
                });
            }
        });


        mongoBatchStream.on("error", (error) => {

            console.error(
                "MONGODB STREAM ERROR:",
                error
            );


            if (!res.headersSent) {

                return res.status(500).json({

                    success: false,

                    message:
                        "MongoDB insertion failed",

                    error:
                        error.message

                });
            }

        });

        console.log("Starting CSV pipeline...");

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

        console.error(
            "BUSBOY ERROR:",
            error
        );

        if (!res.headersSent) {

            res.status(500).json({

                success: false,
                message:
                    "Upload failed",
                error:
                    error.message

            });

        }

    });
    req.pipe(busboy);
};


const getImportStatus = (req, res) => {

    try {

        const { importId } = req.params;

        // Validate importId
        if (!importId) {

            return res.status(400).json({

                success: false,

                message:
                    "importId is required"

            });
        }


        // Get import progress
        const progress =
            getProgress(importId);


        // Import not found
        if (!progress) {

            return res.status(404).json({

                success: false,

                message:
                    "Import not found",

                importId

            });
        }


        // Return status
        return res.status(200).json({

            success: true,

            data: {

                importId,

                status:
                    progress.status,

                rowsProcessed:
                    progress.rowsProcessed,

                rowsPerSecond:  
                    progress.rowsPerSecond

            }

        });

    } catch (error) {

        console.error(
            "GET IMPORT STATUS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to get import status",

            error:
                error.message

        });

    }

};



module.exports = {
    uploadCSV,
    getImportStatus
}
