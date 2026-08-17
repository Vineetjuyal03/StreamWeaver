const Busboy = require("busboy");
const csv = require("csv-parser");
const { Transform } = require("stream");

const createMappingStream =
    require("../streams/cleanRowStream");

const createMongoBatchStream =
    require("../streams/mongoBatchStream");

const createCustomTransformStream =
    require("../streams/customTransformStream");


const uploadCSV = (req, res) => {
    console.log("=================================");
    console.log("CSV UPLOAD STARTED");
    console.log("=================================");

    const busboy = Busboy({
        headers: req.headers
    });

    let mapping = null;
    let fileStarted = false;
    let transformations = [];

    const importId = `import_${Date.now()}`;

    // -----------------------------
    // RECEIVE FORM-DATA FIELD
    // -----------------------------

    // busboy.on("field", (fieldname, value) => {

    //     console.log("FIELD RECEIVED:");
    //     console.log("Name:", fieldname);
    //     console.log("Value:", value);

    //     if (fieldname === "mapping") {

    //         try {

    //             mapping = JSON.parse(value);

    //             console.log(
    //                 "PARSED MAPPING:",
    //                 mapping
    //             );

    //         } catch (error) {

    //             console.error(
    //                 "MAPPING JSON ERROR:",
    //                 error.message
    //             );
    //         }
    //     }
    // });

    busboy.on("field", (fieldname, value) => {

    console.log("FIELD RECEIVED:", fieldname);

    if (fieldname === "mapping") {

        try {

            mapping = JSON.parse(value);

            console.log(
                "Mapping:",
                mapping
            );

        } catch (error) {

            console.error(
                "Invalid mapping:",
                error.message
            );
        }
    }

    if (fieldname === "transformations") {

        try {

            transformations = JSON.parse(value);

            console.log(
                "Transformations:",
                transformations
            );

        } catch (error) {

            console.error(
                "Invalid transformations:",
                error.message
            );
        }
    }
});

    // -----------------------------
    // RECEIVE CSV FILE
    // -----------------------------

    busboy.on("file", (fieldname, file, info) => {

        fileStarted = true;

        console.log("FILE RECEIVED");
        console.log("Field name:", fieldname);
        console.log("Filename:", info.filename);

        /*
         * IMPORTANT:
         *
         * For this test, put mapping BEFORE
         * file in Postman's form-data.
         */

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


        // -----------------------------
        // ROW COUNTER
        // -----------------------------

        // const transformation = {
        //     column: "firstName",
        //     code: "(value) => value.toUpperCase()"
        // };

        // const customTransformStream =
        //     createCustomTransformStream(transformation);

        const transformations = [
            {
                column: "firstName",
                code: "(value) => value.toUpperCase()"
            },
            {
                column: "lastName",
                code: "(value) => value.toUpperCase()"
            },
            {
                column: "emailAddress",
                code: "(value) => value.toLowerCase()"
            },
            {
                column: "Address",
                code: "(value) => value.trim()"
            },
            {
                column: "phone",
                code: "(value) => value.trim()"
            }
        ];

        const customTransformStream =
            createCustomTransformStream(transformations);

        let rowCount = 0;
        const counterStream = new Transform({

            objectMode: true,

            transform(row, encoding, callback) {

                rowCount++;

                console.log(
                    `Mapped row ${rowCount}:`,
                    row
                );

                callback(null, row);
            }
        });


        // -----------------------------
        // MONGODB STREAM
        // -----------------------------

        console.log(
            "Creating MongoDB batch stream..."
        );

        const mongoBatchStream =
            createMongoBatchStream(importId);


        // -----------------------------
        // MONGODB FINISHED
        // -----------------------------

        mongoBatchStream.on("finish", () => {

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

            console.log(
                "Import ID:",
                importId
            );

            console.log(
                "================================="
            );


            if (!res.headersSent) {

                return res.status(200).json({

                    success: true,

                    message:
                        "CSV imported successfully",

                    importId,

                    rowsInserted: rowCount
                });
            }

        });


        // -----------------------------
        // ERROR
        // -----------------------------

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

                    error: error.message
                });
            }
        });

        // -----------------------------
        // PIPELINE
        // -----------------------------

        console.log(
            "Starting CSV pipeline..."
        );

        file
            .pipe(csv())
            .pipe(mappingStream)
            .pipe(customTransformStream)
            .pipe(counterStream)
            .pipe(mongoBatchStream);
    });

    // -----------------------------
    // BUSBOY FINISH
    // -----------------------------

    busboy.on("finish", () => {

        console.log(
            "Busboy finished receiving request"
        );

    });


    // -----------------------------
    // BUSBOY ERROR
    // -----------------------------

    busboy.on("error", (error) => {
        console.error(
            "BUSBOY ERROR:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({

                success: false,

                message:
                    "CSV upload failed",

                error: error.message
            });
        }
    });


    // -----------------------------
    // START BUSBOY
    // -----------------------------

    req.pipe(busboy);
};


module.exports = {
    uploadCSV
};



