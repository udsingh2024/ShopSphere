const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price must be lower than original price',
      },
    },
    inventory: {
      type: Number,
      required: [true, 'Product inventory count is required'],
      min: [0, 'Inventory cannot be negative'],
      default: 0,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    visualEmbedding: {
      type: [Number], // Storing embedding vector for visual search matching
      default: [],
    },
    imageEmbeddings: {
      type: [Number],
      default: [],
    },
    aiDescription: {
      type: String,
      default: '',
    },
    dominantColors: {
      type: [String],
      default: [],
    },
    productTags: {
      type: [String],
      default: [],
    },
    visualKeywords: {
      type: [String],
      default: [],
    },
    imageHash: {
      type: String,
      default: '',
    },
    lastIndexed: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for text search
ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Indexing for category queries and sorting filters
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);
