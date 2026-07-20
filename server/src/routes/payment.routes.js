const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook,
} = require('../controllers/payment.controller');
const { paymentLimiter } = require('../middlewares/rateLimiter');

router.post('/create-order', protect, paymentLimiter, createRazorpayOrder);
router.post('/verify', protect, paymentLimiter, verifyPayment);

// Webhook endpoint (by-passes protect but secure signature verification inside)
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

module.exports = router;
