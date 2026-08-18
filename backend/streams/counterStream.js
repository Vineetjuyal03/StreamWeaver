// const { Transform } = require("stream");
// const {
//     startImport,
//     updateProgress,
//     completeImport,
//     getProgress
// } = require("../utils/importProgress");

// const counterStream = new Transform({

//     objectMode: true,

//     transform(row, encoding, callback) {

//         rowCount++;

//         updateProgress(importId, 1);

//         if (
//             rowCount % 1000 === 0
//         ) {

//             const progress =
//                 getProgress(importId);

//             console.log(
//                 "================================="
//             );

//             console.log(
//                 "Rows processed:",
//                 progress.rowsProcessed
//             );

//             console.log(
//                 "Rows/sec:",
//                 progress.rowsPerSecond
//             );

//             console.log(
//                 "================================="
//             );
//         }

//         callback(null, row);
//     }
// });