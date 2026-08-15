const { Transform } = require("stream");

const createMappingStream = (mapping) => {

    return new Transform({

        objectMode: true,

        transform(row, encoding, callback) {

            try {

                const mappedRow = {};

                for (
                    const sourceColumn in mapping
                ) {

                    const destinationColumn =
                        mapping[sourceColumn];

                    mappedRow[destinationColumn] =
                        row[sourceColumn];
                }

                callback(null, mappedRow);

            } catch (error) {

                callback(error);
            }
        }
    });
};

module.exports =
    createMappingStream;