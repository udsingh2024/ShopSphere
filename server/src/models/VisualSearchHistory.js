const mongoose = require('mongoose');

const VisualSearchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Allow guest history logs
    },
    imageUrl: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    dominantColors: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expiry index: Keep visual search query history for 30 days
VisualSearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
VisualSearchHistorySchema.index({ user: 1 });

module.exports = mongoose.model('VisualSearchHistory', VisualSearchHistorySchema);
