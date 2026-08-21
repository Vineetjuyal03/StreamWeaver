const { Transform } = require("stream");

const createMappingStream = (mapping) => {

    return new Transform({
        objectMode: true,

        transform(row, encoding, callback) {

            console.log("CSV ROW RECEIVED:", row);
            console.log("AVAILABLE COLUMNS:", Object.keys(row));

            const mappedRow = {};

            for (const sourceColumn in mapping) {

                const destinationColumn =
                    mapping[sourceColumn];

                console.log(
                    `Mapping ${sourceColumn} -> ${destinationColumn}`
                );

                console.log(
                    "Value:",
                    row[sourceColumn]
                );

                mappedRow[destinationColumn] =
                    row[sourceColumn];
            }

            console.log(
                "FINAL MAPPED ROW:",
                mappedRow
            );

            callback(null, mappedRow);
        }
    });
};

module.exports = createMappingStream;