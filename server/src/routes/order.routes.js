const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validation.middleware');
const { createOrderSchema } = require('../validators/order.validator');
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
  getInvoice,
} = require('../controllers/order.controller');

router.post('/', protect, validate(createOrderSchema), createOrder);
router.get('/my', protect, getMyOrders);
router.get('/admin', protect, adminOnly, getAdminOrders);
router.get('/:id', protect, getOrderById);
router.get('/:id/invoice', protect, getInvoice);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
