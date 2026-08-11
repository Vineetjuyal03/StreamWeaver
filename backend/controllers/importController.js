// const Busboy = require("busboy");
// const fs = require("fs");
// const path = require("path");

// const uploadCSV = (req, res) => {
//     try {
//         const busboy = Busboy({
//             headers: req.headers
//         });

//         const uploadDir = path.join(__dirname, "/uploads");

//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, {
//                 recursive: true
//             });
//         }

//         let uploadedFileName = "";
//         let uploadedFilePath = "";

//         busboy.on("file", (fieldname, file, info) => {
//             const { filename, mimeType } = info;

//             console.log("File received:");
//             console.log("Field:", fieldname);
//             console.log("Filename:", filename);
//             console.log("MIME type:", mimeType);

//             if (!filename.toLowerCase().endsWith(".csv")) {
//                 file.resume();

//                 return res.status(400).json({
//                     success: false,
//                     message: "Only CSV files are allowed"
//                 });
//             }

//             uploadedFileName = `${Date.now()}-${filename}`;

//             uploadedFilePath = path.join(
//                 uploadDir,
//                 uploadedFileName
//             );

//             const writeStream = fs.createWriteStream(
//                 uploadedFilePath
//             );

//             file.pipe(writeStream);

//             file.on("data", (chunk) => {
//                 console.log(
//                     "Received chunk:",
//                     chunk.length,
//                     "bytes"
//                 );
//             });

//             file.on("end", () => {
//                 console.log("File stream finished");
//             });

//             writeStream.on("finish", () => {
//                 console.log("File successfully saved");
//             });

//             writeStream.on("error", (error) => {
//                 console.error("Write error:", error);
//             });
//         });

//         busboy.on("finish", () => {
//             console.log("Upload request finished");

//             return res.status(200).json({
//                 success: true,
//                 message: "CSV uploaded successfully",
//                 fileName: uploadedFileName
//             });
//         });

//         busboy.on("error", (error) => {
//             console.error("Busboy error:", error);

//             return res.status(500).json({
//                 success: false,
//                 message: "CSV upload failed"
//             });
//         });

//         req.pipe(busboy);

//     } catch (error) {
//         console.error(error);

//         return res.status(500).json({
//             success: false,
//             message: "Something went wrong"
//         });
//     }
// };

// module.exports = {
//     uploadCSV
// };


const Busboy = require("busboy");
const csv = require("csv-parser");

const cleanRowStream = require("../streams/cleanRowStream");

const uploadCSV = (req, res) => {

    const busboy = Busboy({
        headers: req.headers
    });

    let rowCount = 0;

    busboy.on("file", (fieldname, file, info) => {

        const { filename } = info;

        console.log("Processing:", filename);

        file
            .pipe(csv())
            .pipe(cleanRowStream)
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