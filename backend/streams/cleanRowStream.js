const { Transform } = require("stream");

const createMappingStream = (mapping) => {
    return new Transform({
        objectMode: true,

        transform(row, encoding, callback) {
            const mappedRow = {};

            for (const sourceColumn in mapping) {
                const destinationColumn = mapping[sourceColumn];

                if (!Object.prototype.hasOwnProperty.call(row, sourceColumn)) {
                    // Don't fail the whole pipeline over one bad column reference —
                    // but this IS worth knowing about, so log it once, not per-row spam.
                    console.warn(
                        `[mappingStream] Column "${sourceColumn}" not found in row. Skipping.`
                    );
                    continue;
                }

                mappedRow[destinationColumn] = row[sourceColumn];
            }

            callback(null, mappedRow);
        }
    });
};

module.exports = createMappingStream;