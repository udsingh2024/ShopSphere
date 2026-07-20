const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  createRefund,
  getRefundHistory,
} = require('../controllers/refund.controller');

router.post('/:paymentId', protect, adminOnly, createRefund);
router.get('/history', protect, getRefundHistory);

module.exports = router;
