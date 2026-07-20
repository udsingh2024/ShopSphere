const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validation.middleware');
const upload = require('../middlewares/upload.middleware');
const { 
  signupSchema, 
  loginSchema, 
  changePasswordSchema, 
  updateProfileSchema 
} = require('../validators/auth.validator');
const { protect } = require('../middlewares/auth.middleware');
const {
  register,
  verifyEmail,
  login,
  googleLogin,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  deleteAccount,
  getSessions,
  revokeSession,
  uploadAvatar,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public Auth Endpoints
router.post('/register', authLimiter, validate(signupSchema), register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected Auth Endpoints
router.get('/me', protect, getMe);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.delete('/account', protect, deleteAccount);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);

// Wishlist Endpoints
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

module.exports = router;
