const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const logger = require('../utils/logger');

const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }
    
    if (!token) {
      logger.warn(`Socket connection rejected: No authentication token provided.`);
      return next(new Error('Authentication error: No session token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      logger.warn(`Socket connection rejected: Account not found.`);
      return next(new Error('Authentication error: Account not found'));
    }
    
    // Enforce session validity if sessionId is present in token
    if (decoded.sessionId) {
      const session = await Session.findById(decoded.sessionId);
      if (!session || !session.isValid) {
        logger.warn(`Socket connection rejected: Revoked session ID ${decoded.sessionId} for ${user.email}`);
        return next(new Error('Authentication error: Session revoked'));
      }
      socket.sessionId = decoded.sessionId;
    }
    
    // Attach credentials to the socket
    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    next();
  } catch (error) {
    logger.warn(`Socket authentication error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Session expired'));
    }
    return next(new Error('Authentication error: Invalid session token'));
  }
};

module.exports = socketAuthMiddleware;
