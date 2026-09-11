// Wraps an async route handler so any thrown error / rejected promise
// automatically reaches Express's error middleware via next(err),
// instead of silently hanging the request.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;