
const Busboy = require("busboy");
const csv = require("csv-parser");

// const cleanRowStream = require("../streams/cleanRowStream");
const createMappingStream = require("../streams/cleanRowStream");

const uploadCSV = (req, res) => {

    const busboy = Busboy({
        headers: req.headers
    });

     const mapping = {
        first_name: "firstName",
        last_name: "lastName",
        email: "emailAddress"
    };

    let rowCount = 0;

    busboy.on("file", (fieldname, file, info) => {

        const { filename } = info;

        console.log("Processing:", filename);
        const mappingStream = createMappingStream(mapping)

        file
            .pipe(csv())
            .pipe(mappingStream)
            .on("data", (row) => {

                rowCount++;

                console.log("Final row:", row);

            })
            .on("end", () => {

                console.log("CSV processing finished");
                console.log("Total rows:", rowCount);

            })
            .on("error", (error) => {

                console.error("Processing error:", error);

            });
    });

    busboy.on("finish", () => {

        res.json({
            success: true,
            message: "CSV processed successfully"
        });

    });

    req.pipe(busboy);
};

module.exports = {
    uploadCSV
};