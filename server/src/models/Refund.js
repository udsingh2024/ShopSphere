const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    refundId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    reason: {
      type: String,
      default: 'Customer Requested',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Refund', RefundSchema);
