const OrderRepository = require('../repositories/order.repository');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const { generateInvoicePDF } = require('../services/invoice.service');
const logger = require('../utils/logger');

const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentIntentId } = req.body;
    const userId = req.user.id;

    let subtotal = 0;
    const orderItems = [];

    // Lock and decrement inventory, verifying prices
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }

      if (product.inventory < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.title}. Only ${product.inventory} available.`,
        });
      }

      // Decrement stock
      product.inventory -= item.quantity;
      await product.save();

      // Compute item subtotal (use discountPrice if available, else standard price)
      const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += itemPrice * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtPurchase: itemPrice,
      });
    }

    // Financial calculations
    const shippingFee = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% sales tax
    const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'paid';

    const orderData = {
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        id: paymentIntentId || `cod_mock_${Date.now()}`,
        status: paymentStatus,
        method: paymentMethod,
      },
      financials: {
        subtotal,
        shippingFee,
        tax,
        total,
      },
      orderStatus: 'pending',
    };

    const order = await OrderRepository.create(orderData);
    logger.info(`Order placed successfully: ${order._id} by user: ${userId}`);

    // Emit Socket.IO alert to admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_order_placed', {
        orderId: order._id,
        userName: req.user.name,
        total: order.financials.total,
        createdAt: order.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await OrderRepository.findByUser(req.user.id);
    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await OrderRepository.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Authorization: User can only see their own orders unless they are admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const results = await OrderRepository.findAll({ page, limit });
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }

    const order = await OrderRepository.updateStatus(id, orderStatus);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    logger.info(`Order status updated: ${order._id} changed to ${orderStatus}`);

    // Emit Socket.IO alert to User
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.user}`).emit('order_status_updated', {
        orderId: order._id,
        status: orderStatus,
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const order = await OrderRepository.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Access check: User must own the order or be an admin
    const isOwner = order.user && (order.user._id ? order.user._id.toString() : order.user.toString()) === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this order' });
    }

    const invoice = await Invoice.findOne({ order: order._id });
    const invoiceNumber = invoice ? invoice.invoiceNumber : `INV-${order._id.toString().substring(18)}`;

    const pdfBuffer = await generateInvoicePDF(order, invoiceNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
  getInvoice,
};
