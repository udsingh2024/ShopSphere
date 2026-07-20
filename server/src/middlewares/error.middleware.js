const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error to Winston transport
  logger.error(`${req.method} ${req.originalUrl} - Error: ${error.message}\nStack: ${error.stack}`);

  // Convert standard exceptions into standard ApiError objects
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    let message = error.message || 'Internal Server Error';

    // Handle Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      statusCode = 404;
      message = 'Resource not found';
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(error.errors).map((val) => val.message).join(', ');
    }

    // Handle Mongo duplicate key error (code 11000)
    if (error.code === 11000) {
      statusCode = 400;
      message = 'Duplicate key value entered';
    }

    error = new ApiError(statusCode, message, [], err.stack);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    stack: process.env.NODE_ENV === 'production' ? null : error.stack,
  });
};

module.exports = errorHandler;
