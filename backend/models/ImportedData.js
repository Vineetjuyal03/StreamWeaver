const mongoose = require("mongoose");

const importedDataSchema = new mongoose.Schema(
    {
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        importId: {
            type: String,
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "importedData",
    importedDataSchema
);