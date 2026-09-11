class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // "expected" error we deliberately threw, vs. a real bug
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;