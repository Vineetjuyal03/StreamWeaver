// const { Transform } = require("stream");
// const ivm = require("isolated-vm");

// const createCustomTransformStream = (transformation) => {

//     const { column, code } = transformation;

//     if (!column) {
//         throw new Error("Transformation column is required");
//     }

//     if (!code) {
//         throw new Error("Transformation code is required");
//     }

//     return new Transform({
//         objectMode: true,

//         transform(row, encoding, callback) {

//             let isolate;

//             (async () => {

//                 try {

//                     const value = row[column];

//                     console.log(
//                         "Transform column:",
//                         column
//                     );

//                     console.log(
//                         "Original value:",
//                         value
//                     );

//                     isolate = new ivm.Isolate({
//                         memoryLimit: 16
//                     });

//                     const context =
//                         await isolate.createContext();

//                     const jail = context.global;

//                     await jail.set("value", value);

//                     const script =
//                         await isolate.compileScript(
//                             `(${code})(value)`
//                         );

//                     const result =
//                         await script.run(context);

//                     console.log(
//                         "Transformed value:",
//                         result
//                     );

//                     row[column] = result;

//                     callback(null, row);

//                 } catch (error) {

//                     console.error(
//                         "Transformation error:",
//                         error
//                     );

//                     callback(error);

//                 } finally {

//                     if (isolate) {
//                         isolate.dispose();
//                     }
//                 }

//             })();
//         }
//     });
// };

// module.exports = createCustomTransformStream;

// const { Transform } = require("stream");
// const ivm = require("isolated-vm");

// const createCustomTransformStream = (transformations = []) => {

//     if (!Array.isArray(transformations)) {
//         throw new Error("Transformations must be an array");
//     }

//     return new Transform({
//         objectMode: true,

//         async transform(row, encoding, callback) {

//             try {

//                 // Process every transformation
//                 for (const transformation of transformations) {

//                     const { column, code } = transformation;

//                     if (!column || !code) {
//                         console.log(
//                             "Skipping invalid transformation:",
//                             transformation
//                         );

//                         continue;
//                     }

//                     // Check whether column exists
//                     if (!Object.prototype.hasOwnProperty.call(row, column)) {

//                         console.log(
//                             `Column "${column}" not found. Skipping.`
//                         );

//                         continue;
//                     }

//                     const value = row[column];

//                     console.log(
//                         `Transforming ${column}:`,
//                         value
//                     );

//                     const isolate = new ivm.Isolate({
//                         memoryLimit: 16
//                     });

//                     try {

//                         const context =
//                             await isolate.createContext();

//                         const jail = context.global;

//                         await jail.set(
//                             "value",
//                             value
//                         );

//                         const script =
//                             await isolate.compileScript(
//                                 `(${code})(value)`
//                             );

//                         const result =
//                             await script.run(context);

//                         row[column] = result;

//                         console.log(
//                             `Transformed ${column}:`,
//                             result
//                         );

//                     } finally {

//                         isolate.dispose();
//                     }
//                 }

//                 callback(null, row);

//             } catch (error) {

//                 console.error(
//                     "Transformation error:",
//                     error
//                 );

//                 callback(error);
//             }
//         }
//     });
// };

// module.exports =
//     createCustomTransformStream;

const { Transform } = require("stream");
const ivm = require("isolated-vm");

const createCustomTransformStream = (transformations = []) => {

    if (!Array.isArray(transformations)) {
        throw new Error("Transformations must be an array");
    }

    return new Transform({
        objectMode: true,

        async transform(row, encoding, callback) {

            try {

                for (const transformation of transformations) {

                    const { column, code } = transformation;

                    if (!column || !code) {
                        continue;
                    }

                    if (!Object.prototype.hasOwnProperty.call(row, column)) {

                        console.log(
                            `Column "${column}" not found. Skipping transformation.`
                        );

                        continue;
                    }

                    const value = row[column];

                    const isolate = new ivm.Isolate({
                        memoryLimit: 16
                    });

                    try {

                        const context =
                            await isolate.createContext();

                        const jail = context.global;

                        await jail.set("value", value);

                        const script =
                            await isolate.compileScript(
                                `(${code})(value)`
                            );

                        const result =
                            await script.run(context);

                        row[column] = result;

                    } finally {

                        isolate.dispose();
                    }
                }

                callback(null, row);

            } catch (error) {

                callback(error);
            }
        }
    });
};

module.exports = createCustomTransformStream;