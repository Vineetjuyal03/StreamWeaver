const Busboy = require("busboy");
const csv = require("csv-parser");
const { Transform, PassThrough} = require("stream");

const createMappingStream =
    require("../streams/cleanRowStream");

const createMongoBatchStream =
    require("../streams/mongoBatchStream");

const createCustomTransformStream =
    require("../streams/customTransformStream");

const {
    startImport,
    updateProgress,
    completeImport,
    getProgress
} = require("../utils/importProgress");

const counterStream = require('../streams/counterStream')

const uploadCSV = (req, res) => {

    console.log("=================================");
    console.log("CSV UPLOAD STARTED");
    console.log("=================================");

    const busboy = Busboy({
        headers: req.headers
    });

    let mapping = null;
    let transformations = [];
    let fileStream = null;
    let filename = null;

    const importId = `import_${Date.now()}`;
    startImport(importId);

    // Store incoming file chunks temporarily
    const fileBuffer = new PassThrough();


    // =====================================
    // FORM DATA
    // =====================================

    busboy.on("field", (fieldname, value) => {

        console.log("FIELD RECEIVED:");
        console.log("Name:", fieldname);
        console.log("Value:", value);

        if (fieldname === "mapping") {

            try {

                mapping = JSON.parse(value);

                console.log("PARSED MAPPING:",mapping);

            } catch (error) {

                console.error(
                    "Mapping JSON error:",
                    error.message
                );
            }
        }


        if (fieldname === "transformations") {

            try {

                transformations = JSON.parse(value);

                console.log(
                    "PARSED TRANSFORMATIONS:",
                    transformations
                );

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


    console.log(
        "Transformations received:",
        transformations
    );


    const customTransformStream =
        createCustomTransformStream(
            transformations
        );


    let rowCount = 0;


    // const counterStream = new Transform({

    //     objectMode: true,

    //     transform(row, encoding, callback) {

    //         rowCount++;

    //         console.log(
    //             `Mapped row ${rowCount}:`,
    //             row
    //         );

    //         callback(null, row);
    //     }

    // });
    const counterStream = new Transform({

    objectMode: true,

    transform(row, encoding, callback) {

        rowCount++;

        updateProgress(importId, 1);

        if (
            rowCount % 1000 === 0
        ) {

            const progress =
                getProgress(importId);

            console.log(
                "================================="
            );

            console.log(
                "Rows processed:",
                progress.rowsProcessed
            );

            console.log(
                "Rows/sec:",
                progress.rowsPerSecond
            );

            console.log(
                "================================="
            );
        }

        callback(null, row);
    }
});


    const mongoBatchStream =
        createMongoBatchStream(importId);

        completeImport(importId);
    // mongoBatchStream.on("finish", () => {

    //     console.log(
    //         "================================="
    //     );

    //     console.log(
    //         "MONGODB INSERTION COMPLETED"
    //     );

    //     console.log(
    //         "Total rows:",
    //         rowCount
    //     );

    //     console.log(
    //         "Import ID:",
    //         importId
    //     );

    //     if (!res.headersSent) {

    //         return res.status(200).json({

    //             success: true,

    //             message:
    //                 "CSV imported successfully",

    //             importId,

    //             rowsInserted:
    //                 rowCount

    //         });
    //     }

    // });

    mongoBatchStream.on("finish", () => {

    completeImport(importId);

    console.log(
        "================================="
    );

    console.log(
        "MONGODB INSERTION COMPLETED"
    );

    console.log(
        "Total rows:",
        rowCount
    );

    const progress =
        getProgress(importId);

    console.log(
        "Rows/sec:",
        progress.rowsPerSecond
    );

    if (!res.headersSent) {
        return res.status(200).json({

            success: true,

            message:
                "CSV imported successfully",

            importId,

            rowsInserted:
                rowCount,

            rowsPerSecond:
                progress.rowsPerSecond
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

    console.log("Starting CSV pipeline..." );

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


module.exports = {
    uploadCSV
};