const AppError = require("./appError");

function notFoundHandler(req, _res, next) {
  next(new AppError("NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal server error";
  const details = err.details || {};

  console.error("❌ SERVER ERROR:", message);

  res.status(status).json({
    success: false,
    code,
    message,
    details,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
