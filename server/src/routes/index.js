const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const supportRoutes = require('./support.routes');
const visualSearchRoutes = require('./visual-search.routes');
const addressRoutes = require('./address.routes');
const couponRoutes = require('./coupon.routes');
const paymentRoutes = require('./payment.routes');
const refundRoutes = require('./refund.routes');
const notificationRoutes = require('./notification.routes');

const mongoose = require('mongoose');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/support', supportRoutes);
router.use('/visual-search', visualSearchRoutes);
router.use('/addresses', addressRoutes);
router.use('/coupons', couponRoutes);
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/notifications', notificationRoutes);

// Health & Monitoring routes
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  });
});

router.get('/ready', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  // readyState: 1 is connected
  if (dbStatus !== 1) {
    return res.status(503).json({
      status: 'DOWN',
      checks: {
        database: 'disconnected',
      },
    });
  }
  res.json({
    status: 'UP',
    checks: {
      database: 'connected',
    },
  });
});

router.get('/version', (req, res) => {
  const pkg = require('../../package.json');
  res.json({
    version: pkg.version || '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
