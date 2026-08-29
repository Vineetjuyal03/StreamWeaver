const Mapping = require("../models/Mapping");

const saveMapping = async (req, res) => {

    try {

        const { name, mapping } = req.body;


        // ================================
        // NAME VALIDATION
        // ================================

        if (!name || name.trim() === "") {

            return res.status(400).json({

                success: false,

                message:
                    "Mapping name is required"

            });
        }


        // ================================
        // MAPPING VALIDATION
        // ================================

        if (
            !mapping ||
            typeof mapping !== "object" ||
            Array.isArray(mapping) ||
            Object.keys(mapping).length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid mapping is required"

            });
        }


        // ================================
        // SAVE MAPPING
        // ================================

        const savedMapping =
            await Mapping.create({

                name: name.trim(),

                mapping

            });


        // ================================
        // RESPONSE
        // ================================

        return res.status(201).json({

            success: true,

            message:
                "Mapping saved successfully",

            data: savedMapping

        });

    } catch (error) {

        console.error(
            "SAVE MAPPING ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to save mapping",

            error:
                error.message

        });

    }
};



const getMappingById = async (req, res) => {
    try {

        const { id } = req.params;

        // Check ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Mapping ID is required"
            });
        }

        // Find mapping
        const mapping = await Mapping.findById(id);

        // Mapping not found
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: "Mapping not found",
                id
            });
        }

        // Success
        return res.status(200).json({
            success: true,
            data: mapping
        });

    } catch (error) {

        console.error(
            "GET MAPPING ERROR:",
            error
        );

        // Invalid MongoDB ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid mapping ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to get mapping",
            error: error.message
        });
    }
};


module.exports = {
    saveMapping,
    getMappingById
};
