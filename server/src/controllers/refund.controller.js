const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Refund = require('../models/Refund');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY || 'rzp_test_mockkey';
const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_SECERET_KEY || 'mock_secret';

// Setup Razorpay
const getRazorpayInstance = () => {
  const key_id = getRazorpayKeyId();
  const key_secret = getRazorpayKeySecret();
  
  return new Razorpay({
    key_id,
    key_secret,
  });
};

const createRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Refund amount is required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Only captured payments can be refunded' });
    }

    if (amount > payment.amount) {
      return res.status(400).json({ success: false, message: 'Refund amount exceeds payment amount' });
    }

    let refundRecordId = `ref_mock_${Date.now()}`;
    let refundStatus = 'processed';

    // Call Razorpay API if online transaction
    if (payment.method !== 'cod') {
      try {
        const rzp = getRazorpayInstance();
        
        const keyId = getRazorpayKeyId();
        if (keyId && keyId !== 'rzp_test_mockkey') {
          const rzpRefund = await rzp.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(amount * 100), // convert to paise
            notes: {
              reason: reason || 'Customer request',
              adminId: req.user.id,
            },
          });
          refundRecordId = rzpRefund.id;
          refundStatus = rzpRefund.status === 'processed' ? 'processed' : 'pending';
        } else {
          logger.warn('Razorpay keys not configured. Mocking API Refund response.');
        }
      } catch (rzpErr) {
        logger.error(`Razorpay refund failed: ${rzpErr.message}`);
        return res.status(400).json({ success: false, message: `Razorpay Refund failed: ${rzpErr.message}` });
      }
    }

    // Save Refund record
    const refund = await Refund.create({
      payment: payment._id,
      refundId: refundRecordId,
      amount,
      status: refundStatus,
      reason: reason || 'Merchant Initiated Refund',
    });

    // Update payment status
    payment.status = payment.amount === amount ? 'refunded' : 'captured'; // partial refunds keep captured or update status
    await payment.save();

    // Log Transaction ledger
    await Transaction.create({
      user: payment.user,
      type: 'refund',
      amount,
      status: 'success',
      paymentMethod: payment.method,
    });

    // Update Order Status and Restore Inventory Stock
    const order = await Order.findById(payment.order);
    if (order) {
      order.orderStatus = 'refunded';
      await order.save();

      // Restore Inventory Items
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { inventory: item.quantity },
          });
        }
      }
      logger.info(`Restored inventory counts for Order Ref #${order._id.toString().substring(18)} due to refund.`);
    }

    // Send Live Order updates to User room
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${payment.user.toString()}`).emit('order_status_updated', {
        orderId: payment.order.toString(),
        status: 'refunded',
      });
      io.to(`user_${payment.user.toString()}`).emit('notification_received', {
        title: 'Refund Processed',
        body: `Your refund of $${amount.toFixed(2)} was successfully processed.`,
        type: 'payment_success',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Refund successfully completed',
      refund,
    });
  } catch (error) {
    next(error);
  }
};

const getRefundHistory = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    
    // Find all payment records matching ownership
    const userPayments = await Payment.find(query).select('_id');
    const paymentIds = userPayments.map(p => p._id);

    const refunds = await Refund.find({ payment: { $in: paymentIds } })
      .populate({
        path: 'payment',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      refunds,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRefund,
  getRefundHistory,
};
