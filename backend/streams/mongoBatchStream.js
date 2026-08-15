const { Writable } = require("stream");

const ImportedData =
    require("../models/ImportedData");

const BATCH_SIZE = 2500;


const createMongoBatchStream = (importId) => {

    let batch = [];


    return new Writable({

        objectMode: true,


        async write(row, encoding, callback) {

            try {

                console.log(
                    "Mongo stream received row:",
                    row
                );


                batch.push({

                    insertOne: {

                        document: {

                            importId: importId,

                            data: row
                        }
                    }
                });


                console.log(
                    "Current batch size:",
                    batch.length
                );


                // Insert every 1000 rows
                if (batch.length >= BATCH_SIZE) {

                    console.log(
                        "1000 rows reached. Calling bulkWrite..."
                    );


                    const result =
                        await ImportedData.bulkWrite(
                            batch
                        );


                    console.log(
                        "bulkWrite result:",
                        result
                    );


                    batch = [];
                }


                callback();


            } catch (error) {

                console.error(
                    "bulkWrite ERROR:",
                    error
                );

                callback(error);
            }
        },


        async final(callback) {

            try {

                console.log(
                    "Mongo stream FINAL called"
                );

                console.log(
                    "Remaining batch:",
                    batch.length
                );


                // Very important for files
                // containing less than 1000 rows

                if (batch.length > 0) {

                    console.log(
                        "Inserting final batch..."
                    );


                    const result =
                        await ImportedData.bulkWrite(
                            batch
                        );


                    console.log(
                        "FINAL bulkWrite result:",
                        result
                    );


                    batch = [];
                }


                console.log(
                    "MongoDB stream completed"
                );


                callback();


            } catch (error) {

                console.error(
                    "FINAL bulkWrite ERROR:",
                    error
                );

                callback(error);
            }
        }

    });
};


module.exports =
    createMongoBatchStream;