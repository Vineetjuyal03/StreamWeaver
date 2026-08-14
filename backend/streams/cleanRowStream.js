// const { Transform } = require("stream");

// const cleanRowStream = new Transform({
//     objectMode: true,

//     transform(row, encoding, callback) {

//         console.log("Before transform:", row);

//         // Example transformation
//         if (row.first_name) {
//             row.first_name = row.first_name.toUpperCase();
//         }

//         console.log("After transform:", row);

//         callback(null, row);
//     }
// });

// module.exports = cleanRowStream;

const { Transform } = require("stream");

const createMappingStream = (mapping) => {

    return new Transform({
        objectMode: true,

        transform(row, encoding, callback) {

            try {

                const mappedRow = {};

                for (const sourceColumn in mapping) {

                    const destinationField = mapping[sourceColumn];

                    mappedRow[destinationField] = row[sourceColumn];

                }

                console.log("Original:", row);

                console.log("Mapped:", mappedRow);

                callback(null, mappedRow);

            } catch (error) {

                callback(error);

            }
        }
    });
};

module.exports = createMappingStream;