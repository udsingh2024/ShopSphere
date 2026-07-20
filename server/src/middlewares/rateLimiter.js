const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on URL: ${req.originalUrl}`);
      res.status(429).json(options.message);
    },
  });
};

const apiLimiter = createLimiter(
  15 * 60 * 1000,
  500,
  'Too many API requests from this IP, please try again after 15 minutes'
);

const authLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many authentication or credential attempts from this IP, please try again after 15 minutes'
);

const uploadLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many upload or image operations from this IP, please try again after 15 minutes'
);

const paymentLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many billing or transaction attempts from this IP, please try again after 15 minutes'
);

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  paymentLimiter,
};
