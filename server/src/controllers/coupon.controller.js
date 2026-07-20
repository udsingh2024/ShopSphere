const Coupon = require('../models/Coupon');
const logger = require('../utils/logger');

const validateCoupon = async (req, res, next) => {
  try {
    const { code, purchaseAmount } = req.body;
    const userId = req.user.id;

    if (!code || purchaseAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and purchase amount are required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    // Expiry Check
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    // Global Limit Check
    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Purchase threshold
    if (purchaseAmount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of $${coupon.minPurchase} required to apply this coupon`,
      });
    }

    // User Limit Check
    const userRecord = coupon.usedBy.find((record) => record.user.toString() === userId);
    if (userRecord && userRecord.count >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: 'You have reached the usage limit for this coupon' });
    }

    // Calculate Discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (purchaseAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'free_shipping') {
      discount = 0; // Handled separately as shipping waiver
    }

    // Safeguard
    discount = Math.min(discount, purchaseAmount);

    res.json({
      success: true,
      message: 'Coupon code validated successfully',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount,
    });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit,
      perUserLimit,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon with this code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || 0,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit || 100,
      perUserLimit: perUserLimit || 1,
    });

    logger.info(`Coupon ${coupon.code} created by admin ${req.user.email}`);

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    logger.info(`Coupon ID ${id} deleted by admin`);

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  createCoupon,
  getCoupons,
  deleteCoupon,
};
