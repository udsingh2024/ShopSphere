const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB, excluding password
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account not found',
        });
      }

      // Enforce session validity checks
      if (decoded.sessionId) {
        const session = await Session.findById(decoded.sessionId);
        if (!session || !session.isValid) {
          logger.warn(`Rejected invalid session request from user ${user.email} (Session ID: ${decoded.sessionId})`);
          return res.status(401).json({
            success: false,
            code: 'SESSION_REVOKED',
            message: 'Session has been invalidated. Please log in again.',
          });
        }
      }

      // Attach user details and sessionId to the request
      req.user = user;
      req.user.sessionId = decoded.sessionId;

      next();
    } catch (error) {
      logger.warn(`JWT authorization error: ${error.message}`);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token signature',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no session token provided',
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`User ${req.user ? req.user.email : 'anonymous'} attempted access to unauthorized endpoint. Required: [${roles.join(', ')}], actual: ${req.user ? req.user.role : 'none'}`);
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'anonymous'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

const adminOnly = authorize('admin');

module.exports = { protect, authorize, adminOnly };
