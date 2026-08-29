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
                console.log("Mongo stream received row:",row);

                batch.push({
                    insertOne: {
                        document: {
                            importId,
                            data: row
                        }
                    }
                });

                console.log("Current batch size:",batch.length);
                if (batch.length >= BATCH_SIZE) {

                    console.log("1000 rows reached. Calling bulkWrite...");


                    const result =
                        await ImportedData.bulkWrite(
                            batch,
                            {
                                ordered: false
                            }
                        );
                    console.log("bulkWrite result:", result);
                    console.log( `Inserted ${batch.length} rows`);
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
                console.log("Mongo stream FINAL called");
                if (batch.length > 0) {

                    console.log(
                        `Inserting final ${batch.length} rows...`
                    );


                    const result =
                        await ImportedData.bulkWrite(
                            batch,
                            {
                                ordered: false
                            }
                        );


                    console.log(
                        "FINAL bulkWrite result:",
                        result
                    );


                    console.log(
                        `Final ${batch.length} rows inserted`
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