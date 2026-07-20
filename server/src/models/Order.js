const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentInfo: {
      id: { type: String, default: '' }, // Payment intent/transaction ID
      status: {
        type: String,
        required: true,
        enum: ['paid', 'pending', 'failed', 'refunded'],
        default: 'pending',
      },
      method: {
        type: String,
        required: true,
        enum: ['stripe', 'paypal', 'cod'],
        default: 'cod',
      },
    },
    financials: {
      subtotal: { type: Number, required: true },
      shippingFee: { type: Number, required: true, default: 0 },
      tax: { type: Number, required: true, default: 0 },
      total: { type: Number, required: true },
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: { type: String, default: '' },
    shippedAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', OrderSchema);
