const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  validateCoupon,
  createCoupon,
  getCoupons,
  deleteCoupon,
} = require('../controllers/coupon.controller');

router.post('/validate', protect, validateCoupon);
router.post('/admin', protect, adminOnly, createCoupon);
router.get('/admin', protect, adminOnly, getCoupons);
router.delete('/admin/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
