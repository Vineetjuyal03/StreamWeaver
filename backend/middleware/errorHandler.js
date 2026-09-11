const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
    console.error("ERROR HANDLER CAUGHT:", err);

    // Operational errors: expected, safe to show the message directly
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Anything else: unexpected — don't leak internals, but log full detail server-side
    return res.status(500).json({
        success: false,
        message: "Something went wrong on the server.",
    });
};

module.exports = errorHandler;