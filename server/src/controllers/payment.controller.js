const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Shipping = require('../models/Shipping');
const Transaction = require('../models/Transaction');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { generateInvoicePDF } = require('../services/invoice.service');
const { sendOrderConfirmation, sendPaymentFailed, sendRefundConfirmation } = require('../services/email.service');
const logger = require('../utils/logger');
const socketEvents = require('../socket/socketEvents');

// Initialize Razorpay
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
  
  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Create a Razorpay Order for checkout.
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body; // in USD
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // Convert USD to INR (approx multiplier 80) and to paise (multiply by 100)
    const amountInINR = Math.round(amount * 80);
    const amountInPaise = amountInINR * 100;

    let razorpayOrderId = `order_rzp_mock_${Date.now()}`;
    
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_mockkey') {
      try {
        const rzp = getRazorpayInstance();
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_order_${Date.now()}`,
          notes: {
            userId: req.user.id,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        logger.error(`Razorpay order creation failed: ${err.message}`);
        return res.status(400).json({ success: false, message: `Razorpay failed: ${err.message}` });
      }
    } else {
      logger.warn('Razorpay keys not configured. Generating mock order ID.');
    }

    res.json({
      success: true,
      razorpayOrderId,
      amount: amountInINR, // amount in INR
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment signatures and record order fulfillments.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      shippingAddress,
      shippingMethod,
      couponCode,
    } = req.body;

    const userId = req.user.id;

    if (!items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Order items and shipping address are required' });
    }

    // 1. Signature Verification for Online payments
    if (razorpaySignature) {
      const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        logger.warn(`Signature mismatch: Verification failed for user ${req.user.email}`);
        return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid Signature' });
      }
    }

    // 2. Idempotency & Replay Attack Prevention
    if (razorpayPaymentId) {
      const existingPayment = await Payment.findOne({ razorpayPaymentId });
      if (existingPayment) {
        logger.warn(`Replay attack warning: Payment ID ${razorpayPaymentId} already processed.`);
        return res.status(400).json({ success: false, message: 'Payment has already been processed.' });
      }
    }

    // 3. Compute totals and validate stock
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      if (product.inventory < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.title}. Only ${product.inventory} available.`,
        });
      }

      // Decrement inventory stock
      product.inventory -= item.quantity;
      await product.save();

      // Trigger socket stock update immediately
      const io = req.app.get('io');
      if (io) {
        io.emit(socketEvents.STOCK_UPDATED, {
          productId: product._id,
          inventory: product.inventory,
        });

        // Check if stock fell below threshold (10)
        if (product.inventory < 10) {
          io.to('admin_room').emit(socketEvents.LOW_STOCK_ALERT, {
            productId: product._id,
            title: product.title,
            inventory: product.inventory,
          });
        }
      }

      const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += itemPrice * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtPurchase: itemPrice,
      });
    }

    // Apply Coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() <= new Date(coupon.expiryDate) && coupon.usageCount < coupon.usageLimit) {
        if (subtotal >= coupon.minPurchase) {
          if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else if (coupon.discountType === 'flat') {
            discount = coupon.discountValue;
          }
          
          discount = Math.min(discount, subtotal);

          // Update Coupon counts
          coupon.usageCount += 1;
          const userRecord = coupon.usedBy.find((record) => record.user.toString() === userId);
          if (userRecord) {
            userRecord.count += 1;
          } else {
            coupon.usedBy.push({ user: userId, count: 1 });
          }
          await coupon.save();
        }
      }
    }

    // Shipping fee calculations
    const shippingFee = shippingMethod === 'express' ? 25 : shippingMethod === 'priority' ? 10 : (subtotal - discount > 100 ? 0 : 10);
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100; // 8% sales tax
    const total = Math.round((subtotal - discount + shippingFee + tax) * 100) / 100;

    const paymentStatus = razorpaySignature ? 'paid' : 'pending'; // COD sets payment status as pending
    const orderStatus = 'pending';

    // 4. Create Order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        id: razorpayPaymentId || `cod_mock_${Date.now()}`,
        status: paymentStatus,
        method: razorpaySignature ? 'stripe' : 'cod', // stripe as online provider placeholder
      },
      financials: {
        subtotal,
        shippingFee,
        tax,
        total,
      },
      orderStatus,
    });

    // 5. Create Payment record in DB
    const payment = await Payment.create({
      user: userId,
      order: order._id,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || `cod_${Date.now()}`,
      razorpaySignature: razorpaySignature || '',
      amount: total,
      currency: 'USD',
      status: razorpaySignature ? 'captured' : 'pending',
      method: razorpaySignature ? 'upi' : 'cod', // mock online method
    });

    // 6. Create Invoice record in DB
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(order._id).substring(18).toUpperCase()}`;
    await Invoice.create({
      order: order._id,
      invoiceNumber,
      amount: total,
    });

    // 7. Create Shipping record in DB
    const daysToAdd = shippingMethod === 'express' ? 2 : shippingMethod === 'priority' ? 4 : 7;
    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + daysToAdd);

    await Shipping.create({
      order: order._id,
      method: shippingMethod || 'standard',
      status: 'pending',
      estimatedDelivery: estDelivery,
    });

    // 8. Create Transaction ledger
    await Transaction.create({
      user: userId,
      type: 'payment',
      amount: total,
      status: 'success',
      paymentMethod: razorpaySignature ? 'card' : 'cod',
    });

    // 9. Generate PDF Invoice & Email Notification
    try {
      const populatedOrder = await Order.findById(order._id).populate('user', 'name email').populate('items.product', 'title');
      const invoiceBuffer = await generateInvoicePDF(populatedOrder, invoiceNumber);

      await sendOrderConfirmation(req.user.email, populatedOrder, invoiceBuffer, invoiceNumber);
    } catch (pdfErr) {
      logger.error(`Fulfillment PDF/Email failed: ${pdfErr.message}`);
    }

    // 10. Clear Frontend User's synced cart
    await User.findByIdAndUpdate(userId, { cart: [] });

    // 11. Emit Socket updates
    const io = req.app.get('io');
    if (io) {
      // Notify Admin room
      io.to('admin_room').emit(socketEvents.NEW_ORDER_PLACED, {
        orderId: order._id,
        userName: req.user.name,
        total: order.financials.total,
        createdAt: order.createdAt,
      });

      // Update visitor/revenue metrics
      const sockets = await io.fetchSockets();
      io.to('admin_room').emit(socketEvents.DASHBOARD_UPDATED, {
        ordersCount: await Order.countDocuments(),
        revenueValue: total,
      });

      // Send to personal user room
      io.to(`user_${userId}`).emit('notification_received', {
        title: 'Order Placed!',
        body: `Order #${String(order._id).substring(18)} placed successfully.`,
        type: 'order_update',
      });
      io.to(`user_${userId}`).emit(socketEvents.CART_SYNCED, []);
    }

    res.status(201).json({
      success: true,
      message: 'Order created and payment completed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Secure Webhook Listener for Razorpay payment notifications.
 */
const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_mock';

    // Verify webhook signature authenticity
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      logger.warn('Razorpay Webhook: Signature signature verification failed.');
      return res.status(400).json({ success: false, message: 'Invalid signature verification' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    logger.info(`Razorpay Webhook Event Received: ${event}`);

    // Handle Captured Event
    if (event === 'payment.captured') {
      const paymentObj = payload.payment.entity;
      const rzpPaymentId = paymentObj.id;
      const rzpOrderId = paymentObj.order_id;
      const amount = paymentObj.amount / 100; // in INR

      // Idempotency: verify if already stored
      const existing = await Payment.findOne({ razorpayPaymentId: rzpPaymentId });
      if (existing) {
        return res.json({ status: 'ok', message: 'Already processed' });
      }

      // Update payment record
      await Payment.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        { status: 'captured', razorpayPaymentId: rzpPaymentId },
        { new: true }
      );
      logger.info(`Payment verified and captured via Webhook: ${rzpPaymentId}`);
    }

    // Handle Failed Event
    if (event === 'payment.failed') {
      const paymentObj = payload.payment.entity;
      const rzpPaymentId = paymentObj.id;
      const rzpOrderId = paymentObj.order_id;
      const notes = paymentObj.notes || {};

      await Payment.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        { status: 'failed', razorpayPaymentId: rzpPaymentId }
      );

      // Fetch user profile and email alert
      const user = await User.findById(notes.userId);
      if (user) {
        await sendPaymentFailed(user.email, paymentObj.amount / 100, paymentObj.error_description);
      }
      logger.warn(`Payment failed via Webhook: ${rzpPaymentId}`);
    }

    // Handle Refund Processed Event
    if (event === 'refund.processed') {
      const refundObj = payload.refund.entity;
      const refundId = refundObj.id;
      const paymentId = refundObj.payment_id;

      const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
      if (payment) {
        await Refund.findOneAndUpdate({ refundId }, { status: 'processed' });
        payment.status = 'refunded';
        await payment.save();

        const user = await User.findById(payment.user);
        if (user) {
          await sendRefundConfirmation(user.email, refundObj.amount / 100, payment.order.toString());
        }
      }
      logger.info(`Refund processed successfully via Webhook: ${refundId}`);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook,
};
