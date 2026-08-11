const { Transform } = require("stream");

const cleanRowStream = new Transform({
    objectMode: true,

    transform(row, encoding, callback) {

        console.log("Before transform:", row);

        // Example transformation
        if (row.first_name) {
            row.first_name = row.first_name.toUpperCase();
        }

        console.log("After transform:", row);

        callback(null, row);
    }
});

module.exports = cleanRowStream;