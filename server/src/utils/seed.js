require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');
const AIService = require('../services/ai.service');

const seedData = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopsphere';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear old data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await ChatMessage.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing database collections.');

    // 1. Create Users
    const admin = await User.create({
      name: 'ShopSphere Admin',
      email: 'admin@shopsphere.com',
      password: 'Password123!',
      role: 'admin',
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&q=80',
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'user@shopsphere.com',
      password: 'Password123!',
      role: 'customer',
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
    });

    console.log('Created Seed Users:');
    console.log(`- Admin: ${admin.email} (password: Password123!)`);
    console.log(`- User: ${user.email} (password: Password123!)`);

    // 2. Create Categories
    const electronics = await Category.create({ name: 'Electronics', slug: 'electronics' });
    const fashion = await Category.create({ name: 'Fashion', slug: 'fashion' });
    const homeDecor = await Category.create({ name: 'Home Decor', slug: 'home-decor' });
    const sports = await Category.create({ name: 'Sports & Outdoors', slug: 'sports-outdoors' });

    console.log('Created Categories: Electronics, Fashion, Home Decor, Sports');

    // Helper for visual search vectors
    const createEmbedding = (title, desc, catId) => {
      return AIService.generateEmbedding(`${title}_${desc}_${catId}`);
    };

    // 3. Create Products
    const productsData = [
      {
        title: 'Wireless Noise-Cancelling Headphones',
        description: 'Immersive sound quality with industry-leading active noise cancellation. Features Bluetooth 5.2, 40 hours of battery life, and memory foam ear cushions.',
        price: 199.99,
        inventory: 25,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
            publicId: 'seed_headphones_1',
          },
        ],
        category: electronics._id,
        tags: ['headphones', 'sound', 'wireless', 'electronics', 'black'],
        ratings: { average: 4.8, count: 124 },
      },
      {
        title: 'Smartwatch Series X',
        description: 'Track your health, receive notifications, and keep time in style. Features heart rate monitoring, sleep analysis, and water resistance up to 50m.',
        price: 249.99,
        inventory: 15,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
            publicId: 'seed_watch_1',
          },
        ],
        category: electronics._id,
        tags: ['watch', 'smart', 'fitness', 'electronics', 'white'],
        ratings: { average: 4.5, count: 86 },
      },
      {
        title: 'Classic Black Leather Jacket',
        description: 'Timeless style crafted from genuine lambskin leather. Features a soft interior lining, heavy-duty metallic zippers, and three utility pockets.',
        price: 149.99,
        inventory: 10,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
            publicId: 'seed_jacket_1',
          },
        ],
        category: fashion._id,
        tags: ['jacket', 'leather', 'fashion', 'clothing', 'black'],
        ratings: { average: 4.7, count: 53 },
      },
      {
        title: 'Breathable Running Shoes',
        description: 'Lightweight running shoes built for maximum speed and shock absorption. Breathable mesh top guarantees comfort even during intense workouts.',
        price: 79.99,
        inventory: 30,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
            publicId: 'seed_shoe_1',
          },
        ],
        category: fashion._id,
        tags: ['shoe', 'running', 'fashion', 'sports', 'red'],
        ratings: { average: 4.6, count: 210 },
      },
      {
        title: 'Modern Ceramic Flower Vase',
        description: 'Add a touch of contemporary elegance to your living space. Handcrafted white ceramic vase with a matte ribbed surface design.',
        price: 34.99,
        inventory: 40,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80',
            publicId: 'seed_vase_1',
          },
        ],
        category: homeDecor._id,
        tags: ['vase', 'ceramic', 'decor', 'home', 'white'],
        ratings: { average: 4.4, count: 32 },
      },
      {
        title: 'Abstract Canvas Wall Art',
        description: 'High-definition artwork printed on premium cotton canvas. Vibrant colors and dynamic brushstrokes bring any boring wall to life.',
        price: 59.99,
        inventory: 20,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
            publicId: 'seed_art_1',
          },
        ],
        category: homeDecor._id,
        tags: ['art', 'canvas', 'decor', 'home', 'blue'],
        ratings: { average: 4.9, count: 18 },
      },
      {
        title: 'Insulated Sports Water Bottle',
        description: 'Double-walled stainless steel bottle that keeps drinks cold for 24 hours or hot for 12 hours. leak-proof straw lid design.',
        price: 19.99,
        inventory: 50,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
            publicId: 'seed_bottle_1',
          },
        ],
        category: sports._id,
        tags: ['bottle', 'water', 'sports', 'outdoors', 'green'],
        ratings: { average: 4.7, count: 95 },
      },
      {
        title: 'Instant Setup 4-Person Tent',
        description: 'Enjoy nature with zero setup frustration. Pre-assembled poles allow setup in under 60 seconds. Rainfly and ventilated windows included.',
        price: 139.99,
        inventory: 8,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80',
            publicId: 'seed_tent_1',
          },
        ],
        category: sports._id,
        tags: ['tent', 'camping', 'sports', 'outdoors', 'green'],
        ratings: { average: 4.5, count: 42 },
      },
    ];

    for (const p of productsData) {
      const slug = p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') + '-' + Date.now();
      const visualEmbedding = createEmbedding(p.title, p.description, p.category);
      
      await Product.create({
        ...p,
        slug,
        visualEmbedding,
      });
    }

    const Coupon = require('../models/Coupon');
    await Coupon.deleteMany({});
    
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 50,
        maxDiscount: 20,
        expiryDate: expiry,
        usageLimit: 1000,
        perUserLimit: 1,
      },
      {
        code: 'FLAT20',
        discountType: 'flat',
        discountValue: 20,
        minPurchase: 100,
        expiryDate: expiry,
        usageLimit: 500,
        perUserLimit: 2,
      },
      {
        code: 'FREESHIP',
        discountType: 'free_shipping',
        discountValue: 0,
        minPurchase: 0,
        expiryDate: expiry,
        usageLimit: 1000,
        perUserLimit: 1,
      }
    ]);

    console.log('Seeded 3 standard checkout promo coupons.');
    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
