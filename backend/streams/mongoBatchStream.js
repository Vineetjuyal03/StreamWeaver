const mongoose = require("mongoose");
const { Writable } = require("stream");

const BATCH_SIZE = 2500;

const createMongoBatchStream = (importId, collectionName) => {
    let batch = [];
    const collection = mongoose.connection.db.collection(collectionName);

    return new Writable({
        objectMode: true,

        async write(row, encoding, callback) {
            try {
                batch.push({
                    insertOne: {
                        document: { ...row, _importId: importId },
                    },
                });

                if (batch.length >= BATCH_SIZE) {
                    await collection.bulkWrite(batch, { ordered: false });
                    batch = [];
                }

                callback();
            } catch (error) {
                callback(error);
            }
        },

        async final(callback) {
            try {
                if (batch.length > 0) {
                    await collection.bulkWrite(batch, { ordered: false });
                    batch = [];
                }
                callback();
            } catch (error) {
                callback(error);
            }
        },
    });
};

module.exports = createMongoBatchStream;