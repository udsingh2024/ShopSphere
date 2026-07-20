const mongoose = require('mongoose');

const ShippingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    carrier: {
      type: String,
      default: 'ShopSphere Logistics',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'priority'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    estimatedDelivery: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Shipping', ShippingSchema);
