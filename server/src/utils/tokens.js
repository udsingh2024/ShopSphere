const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId, sessionId = '') => {
  return jwt.sign({ id: userId, sessionId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId, sessionId = '') => {
  return jwt.sign({ id: userId, sessionId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
};
