const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config(); // Fallback to cwd .env
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const AIService = require('../services/ai.service');
const CacheService = require('../services/cache.service');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopsphere';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding 50+ products...');

    // Clear old collections for a fresh seed
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await ChatMessage.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    console.log('Cleared existing database collections.');

    // 1. Seed Core Users
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

    console.log('Created Users:');
    console.log(` - Admin: ${admin.email} (password: Password123!)`);
    console.log(` - Customer: ${user.email} (password: Password123!)`);

    // 2. Seed 5 Categories
    const electronics = await Category.create({ name: 'Electronics', slug: 'electronics' });
    const fashion = await Category.create({ name: 'Fashion', slug: 'fashion' });
    const homeDecor = await Category.create({ name: 'Home Decor', slug: 'home-decor' });
    const sports = await Category.create({ name: 'Sports & Outdoors', slug: 'sports-outdoors' });
    const beauty = await Category.create({ name: 'Beauty & Wellness', slug: 'beauty-wellness' });

    console.log('Created 5 Main Categories: Electronics, Fashion, Home Decor, Sports & Outdoors, Beauty & Wellness');

    // Vector helper
    const createEmbedding = (title, desc, catName, tags) => {
      const descriptors = {
        category: catName,
        productType: title,
        dominantColors: tags.slice(0, 2),
        tags: tags,
      };
      return AIService.generateVectorFromDescriptors(descriptors);
    };

    // 3. 50 E-Commerce Products Dataset
    const rawProducts = [
      // ELECTRONICS (12 Items)
      {
        title: 'Wireless Noise-Cancelling Headphones',
        description: 'Immersive sound quality with industry-leading active noise cancellation. Features Bluetooth 5.2, 40 hours of battery life, and memory foam ear cushions.',
        price: 199.99,
        discountPrice: 169.99,
        inventory: 25,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        cat: electronics,
        tags: ['headphones', 'sound', 'wireless', 'electronics', 'black'],
        ratings: { average: 4.8, count: 124 },
        colors: ['black', 'silver'],
      },
      {
        title: 'Smartwatch Series X Pro',
        description: 'Track your fitness, heart rate, and sleep metrics in real-time. Features AMOLED display, GPS tracking, and 50m water resistance.',
        price: 249.99,
        discountPrice: 219.99,
        inventory: 18,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
        cat: electronics,
        tags: ['smartwatch', 'fitness', 'tech', 'electronics', 'white'],
        ratings: { average: 4.7, count: 89 },
        colors: ['white', 'black'],
      },
      {
        title: 'Ultra-Thin Mechanical Keyboard',
        description: 'RGB mechanical gaming keyboard with low-profile tactile switches. Durable aluminum frame with multi-device Bluetooth connectivity.',
        price: 129.99,
        discountPrice: 0,
        inventory: 30,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
        cat: electronics,
        tags: ['keyboard', 'gaming', 'rgb', 'electronics', 'black'],
        ratings: { average: 4.6, count: 64 },
        colors: ['black', 'rgb'],
      },
      {
        title: 'Ergonomic Wireless Gaming Mouse',
        description: 'High-precision 26,000 DPI optical sensor mouse with customizable side buttons and ultra-lightweight ergonomic chassis.',
        price: 79.99,
        discountPrice: 64.99,
        inventory: 45,
        imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
        cat: electronics,
        tags: ['mouse', 'gaming', 'wireless', 'electronics', 'black'],
        ratings: { average: 4.9, count: 142 },
        colors: ['black'],
      },
      {
        title: '4K Ultra HD Streaming Camera',
        description: 'Professional 4K webcam with dual noise-reduction microphones and auto-framing AI software for creator streams and video conferences.',
        price: 159.99,
        discountPrice: 0,
        inventory: 22,
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
        cat: electronics,
        tags: ['camera', 'webcam', '4k', 'electronics', 'black'],
        ratings: { average: 4.5, count: 53 },
        colors: ['black'],
      },
      {
        title: 'Portable Bluetooth Speaker',
        description: '360-degree room-filling audio with punchy bass. IPX7 waterproof body with 24-hour continuous playtime.',
        price: 89.99,
        discountPrice: 74.99,
        inventory: 35,
        imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80',
        cat: electronics,
        tags: ['speaker', 'audio', 'bluetooth', 'electronics', 'blue'],
        ratings: { average: 4.7, count: 215 },
        colors: ['blue', 'black'],
      },
      {
        title: 'Foldable Compact Drone 4K',
        description: 'Lightweight drone featuring 3-axis gimbal 4K video, 30-minute flight time, and optical obstacle sensors.',
        price: 499.99,
        discountPrice: 449.99,
        inventory: 10,
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80',
        cat: electronics,
        tags: ['drone', 'camera', '4k', 'electronics', 'gray'],
        ratings: { average: 4.8, count: 78 },
        colors: ['gray'],
      },
      {
        title: 'True Wireless Earbuds with Charging Case',
        description: 'Crystal-clear call quality with passive noise isolation, touch controls, and wireless charging case.',
        price: 59.99,
        discountPrice: 49.99,
        inventory: 60,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
        cat: electronics,
        tags: ['earbuds', 'wireless', 'audio', 'electronics', 'white'],
        ratings: { average: 4.4, count: 180 },
        colors: ['white'],
      },
      {
        title: 'High-Speed MagSafe Power Bank 10,000mAh',
        description: 'Magnetic wireless power bank with USB-C fast charging support. Ultra-slim metallic minimalist design.',
        price: 49.99,
        discountPrice: 0,
        inventory: 50,
        imageUrl: 'https://images.unsplash.com/photo-1609592424074-9549f476a267?w=600&q=80',
        cat: electronics,
        tags: ['powerbank', 'magsafe', 'charger', 'electronics', 'black'],
        ratings: { average: 4.6, count: 95 },
        colors: ['black', 'silver'],
      },
      {
        title: '27-inch IPS Gaming Monitor 165Hz',
        description: 'QHD 1440p gaming monitor featuring 1ms response time, HDR10 support, and AMD FreeSync Premium technology.',
        price: 299.99,
        discountPrice: 269.99,
        inventory: 14,
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
        cat: electronics,
        tags: ['monitor', 'gaming', 'display', 'electronics', 'black'],
        ratings: { average: 4.9, count: 110 },
        colors: ['black'],
      },
      {
        title: 'Smart Home Security Camera 1080p',
        description: 'Indoor Wi-Fi security camera with 360-degree pan/tilt, night vision, and two-way voice communication.',
        price: 39.99,
        discountPrice: 0,
        inventory: 40,
        imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80',
        cat: electronics,
        tags: ['security', 'camera', 'smarthome', 'electronics', 'white'],
        ratings: { average: 4.3, count: 67 },
        colors: ['white'],
      },
      {
        title: 'Virtual Reality Headset 128GB',
        description: 'Standalone VR headset with 3D positional audio, high-resolution screens, and intuitive motion controllers.',
        price: 399.99,
        discountPrice: 359.99,
        inventory: 12,
        imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=600&q=80',
        cat: electronics,
        tags: ['vr', 'headset', 'gaming', 'electronics', 'white'],
        ratings: { average: 4.8, count: 155 },
        colors: ['white', 'black'],
      },

      // FASHION (12 Items)
      {
        title: 'Classic Black Leather Jacket',
        description: 'Timeless style crafted from genuine lambskin leather. Features soft interior lining, metallic zippers, and three utility pockets.',
        price: 149.99,
        discountPrice: 129.99,
        inventory: 10,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
        cat: fashion,
        tags: ['jacket', 'leather', 'fashion', 'clothing', 'black'],
        ratings: { average: 4.7, count: 53 },
        colors: ['black'],
      },
      {
        title: 'Breathable Red Running Shoes',
        description: 'Lightweight running shoes built for speed and shock absorption. Breathable mesh upper guarantees workout comfort.',
        price: 79.99,
        discountPrice: 69.99,
        inventory: 30,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
        cat: fashion,
        tags: ['shoe', 'running', 'fashion', 'sports', 'red'],
        ratings: { average: 4.6, count: 210 },
        colors: ['red', 'white'],
      },
      {
        title: 'Minimalist Cotton Hoodie',
        description: 'Premium heavyweight organic cotton hoodie with plush fleece lining. Relaxed unisex fit for streetwear styling.',
        price: 59.99,
        discountPrice: 0,
        inventory: 40,
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
        cat: fashion,
        tags: ['hoodie', 'cotton', 'streetwear', 'fashion', 'gray'],
        ratings: { average: 4.5, count: 88 },
        colors: ['gray', 'black'],
      },
      {
        title: 'Slim-Fit Stretch Denim Jeans',
        description: 'Modern slim-fit denim crafted from premium stretch cotton. Durable stitching with classic 5-pocket styling.',
        price: 69.99,
        discountPrice: 54.99,
        inventory: 35,
        imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
        cat: fashion,
        tags: ['jeans', 'denim', 'pants', 'fashion', 'blue'],
        ratings: { average: 4.4, count: 112 },
        colors: ['blue'],
      },
      {
        title: 'Polarized Aviator Sunglasses',
        description: 'Classic metal frame sunglasses with UV400 polarized lenses. Anti-glare coating with lightweight comfortable nose pads.',
        price: 39.99,
        discountPrice: 0,
        inventory: 50,
        imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
        cat: fashion,
        tags: ['sunglasses', 'aviator', 'eyewear', 'fashion', 'gold'],
        ratings: { average: 4.6, count: 76 },
        colors: ['gold', 'black'],
      },
      {
        title: 'Water-Resistant Canvas Backpack',
        description: 'Spacious daily commute backpack featuring 15.6-inch padded laptop compartment, anti-theft zipper, and USB charging port.',
        price: 49.99,
        discountPrice: 39.99,
        inventory: 28,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
        cat: fashion,
        tags: ['backpack', 'bag', 'travel', 'fashion', 'brown'],
        ratings: { average: 4.8, count: 164 },
        colors: ['brown', 'black'],
      },
      {
        title: 'Vintage Leather Dress Shoes',
        description: 'Handcrafted Oxford dress shoes made of polished full-grain leather. Cushioned footbed with anti-slip rubber outsole.',
        price: 119.99,
        discountPrice: 99.99,
        inventory: 16,
        imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&q=80',
        cat: fashion,
        tags: ['shoes', 'oxford', 'formal', 'fashion', 'brown'],
        ratings: { average: 4.7, count: 42 },
        colors: ['brown'],
      },
      {
        title: 'Summer Floral Maxi Dress',
        description: 'Flowy lightweight chiffon dress with delicate floral prints. Breathable elastic waistline suitable for summer outings.',
        price: 54.99,
        discountPrice: 0,
        inventory: 25,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
        cat: fashion,
        tags: ['dress', 'floral', 'summer', 'fashion', 'yellow'],
        ratings: { average: 4.5, count: 61 },
        colors: ['yellow', 'white'],
      },
      {
        title: 'Chunky Retro White Sneakers',
        description: '90s inspired dad sneakers with thick rubber soles and multi-layered leather panels. Maximum cushioning for casual wear.',
        price: 89.99,
        discountPrice: 74.99,
        inventory: 22,
        imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
        cat: fashion,
        tags: ['sneakers', 'shoes', 'retro', 'fashion', 'white'],
        ratings: { average: 4.6, count: 98 },
        colors: ['white'],
      },
      {
        title: 'Luxury Stainless Steel Chronograph Watch',
        description: 'Precision Japanese quartz watch featuring scratch-resistant sapphire crystal glass and luminous dial markers.',
        price: 189.99,
        discountPrice: 159.99,
        inventory: 15,
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
        cat: fashion,
        tags: ['watch', 'luxury', 'accessory', 'fashion', 'silver'],
        ratings: { average: 4.9, count: 130 },
        colors: ['silver'],
      },
      {
        title: 'Wool Blend Trench Coat',
        description: 'Double-breasted long winter coat crafted from warm wool blend fabric. Features waist belt and notched lapels.',
        price: 169.99,
        discountPrice: 139.99,
        inventory: 12,
        imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80',
        cat: fashion,
        tags: ['coat', 'winter', 'wool', 'fashion', 'beige'],
        ratings: { average: 4.8, count: 47 },
        colors: ['beige', 'black'],
      },
      {
        title: 'Casual Canvas Tote Bag',
        description: 'Eco-friendly heavy-duty cotton canvas tote bag with inner zippered pocket and magnetic snap closure.',
        price: 24.99,
        discountPrice: 0,
        inventory: 55,
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
        cat: fashion,
        tags: ['tote', 'bag', 'canvas', 'fashion', 'cream'],
        ratings: { average: 4.3, count: 82 },
        colors: ['cream'],
      },

      // HOME DECOR (10 Items)
      {
        title: 'Modern Ceramic Flower Vase',
        description: 'Add contemporary elegance to your living space. Handcrafted white ceramic vase with matte ribbed surface design.',
        price: 34.99,
        discountPrice: 29.99,
        inventory: 40,
        imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80',
        cat: homeDecor,
        tags: ['vase', 'ceramic', 'decor', 'home', 'white'],
        ratings: { average: 4.4, count: 32 },
        colors: ['white'],
      },
      {
        title: 'Abstract Canvas Wall Art',
        description: 'High-definition artwork printed on premium cotton canvas. Vibrant brushstrokes bring any wall to life.',
        price: 59.99,
        discountPrice: 49.99,
        inventory: 20,
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
        cat: homeDecor,
        tags: ['art', 'canvas', 'decor', 'home', 'blue'],
        ratings: { average: 4.9, count: 18 },
        colors: ['blue', 'gold'],
      },
      {
        title: 'Nordic Wooden LED Desk Lamp',
        description: 'Minimalist solid wood desk lamp with dimmable LED lighting and adjustable touch controls.',
        price: 45.99,
        discountPrice: 0,
        inventory: 30,
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
        cat: homeDecor,
        tags: ['lamp', 'lighting', 'nordic', 'home', 'wood'],
        ratings: { average: 4.7, count: 74 },
        colors: ['wood', 'white'],
      },
      {
        title: 'Soft Velvet Throw Pillow Set of 2',
        description: 'Luxurious plush velvet cushion covers with invisible zipper closure. Accent decor for sofas and armchairs.',
        price: 29.99,
        discountPrice: 24.99,
        inventory: 45,
        imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
        cat: homeDecor,
        tags: ['pillow', 'velvet', 'decor', 'home', 'green'],
        ratings: { average: 4.6, count: 91 },
        colors: ['green', 'yellow'],
      },
      {
        title: 'Aromatic Soy Wax Scented Candle',
        description: 'Hand-poured natural soy wax candle scented with French lavender and vanilla. Burns cleanly for up to 50 hours.',
        price: 22.99,
        discountPrice: 0,
        inventory: 50,
        imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80',
        cat: homeDecor,
        tags: ['candle', 'scented', 'home', 'decor', 'amber'],
        ratings: { average: 4.8, count: 120 },
        colors: ['amber'],
      },
      {
        title: 'Minimalist Wall Mirror with Brass Frame',
        description: 'Round HD glass wall mirror encircled by a slim brushed brass metallic frame. Expands room lighting.',
        price: 89.99,
        discountPrice: 79.99,
        inventory: 15,
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
        cat: homeDecor,
        tags: ['mirror', 'wall', 'decor', 'home', 'gold'],
        ratings: { average: 4.8, count: 56 },
        colors: ['gold'],
      },
      {
        title: 'Ergonomic Breathable Mesh Office Chair',
        description: 'Executive office chair with adjustable lumbar support, 3D armrests, and synchro-tilt mechanism.',
        price: 199.99,
        discountPrice: 179.99,
        inventory: 18,
        imageUrl: 'https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=600&q=80',
        cat: homeDecor,
        tags: ['chair', 'office', 'furniture', 'home', 'black'],
        ratings: { average: 4.7, count: 140 },
        colors: ['black'],
      },
      {
        title: 'Handwoven Boho Jute Area Rug 4x6',
        description: 'Eco-friendly natural jute rug braided by master artisans. Adds warm organic texture to living rooms.',
        price: 79.99,
        discountPrice: 0,
        inventory: 22,
        imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&q=80',
        cat: homeDecor,
        tags: ['rug', 'jute', 'boho', 'home', 'brown'],
        ratings: { average: 4.5, count: 38 },
        colors: ['brown', 'beige'],
      },
      {
        title: 'Pour-Over Glass Coffee Maker 800ml',
        description: 'Heat-resistant borosilicate glass carafe with reusable stainless steel double-mesh filter cone.',
        price: 32.99,
        discountPrice: 27.99,
        inventory: 35,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
        cat: homeDecor,
        tags: ['coffee', 'maker', 'kitchen', 'home', 'clear'],
        ratings: { average: 4.9, count: 104 },
        colors: ['clear', 'black'],
      },
      {
        title: 'Modern Silent Digital Wall Clock',
        description: 'Non-ticking silent quartz wall clock with large 3D numerals and auto ambient light sensor.',
        price: 27.99,
        discountPrice: 0,
        inventory: 40,
        imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&q=80',
        cat: homeDecor,
        tags: ['clock', 'wall', 'decor', 'home', 'black'],
        ratings: { average: 4.3, count: 49 },
        colors: ['black', 'white'],
      },

      // SPORTS & OUTDOORS (10 Items)
      {
        title: 'Insulated Sports Water Bottle 1L',
        description: 'Double-walled stainless steel bottle that keeps drinks cold for 24 hours or hot for 12 hours. Leak-proof straw lid.',
        price: 19.99,
        discountPrice: 16.99,
        inventory: 50,
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
        cat: sports,
        tags: ['bottle', 'water', 'sports', 'outdoors', 'green'],
        ratings: { average: 4.7, count: 95 },
        colors: ['green', 'black'],
      },
      {
        title: 'Instant Setup 4-Person Waterproof Tent',
        description: 'Pre-assembled poles allow setup in under 60 seconds. Heavy-duty rainfly and ventilated mesh windows included.',
        price: 139.99,
        discountPrice: 119.99,
        inventory: 8,
        imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80',
        cat: sports,
        tags: ['tent', 'camping', 'sports', 'outdoors', 'green'],
        ratings: { average: 4.5, count: 42 },
        colors: ['green'],
      },
      {
        title: 'Non-Slip Extra Thick Yoga Mat',
        description: '6mm high-density eco TPE yoga mat with alignment guidelines. Includes carrying strap for gym portability.',
        price: 34.99,
        discountPrice: 0,
        inventory: 40,
        imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80',
        cat: sports,
        tags: ['yogamat', 'fitness', 'yoga', 'sports', 'purple'],
        ratings: { average: 4.8, count: 175 },
        colors: ['purple', 'pink'],
      },
      {
        title: 'Adjustable Dumbbell Set 50lbs',
        description: 'Quick dial dumbbell adjustment system from 5 to 50 lbs. Replaces 15 sets of weights in one compact footprint.',
        price: 299.99,
        discountPrice: 269.99,
        inventory: 10,
        imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80',
        cat: sports,
        tags: ['dumbbell', 'weights', 'fitness', 'sports', 'black'],
        ratings: { average: 4.9, count: 210 },
        colors: ['black'],
      },
      {
        title: '50L Hiking Backpack with Rain Cover',
        description: 'Ergonomic internal frame trekking pack with breathable back panel, hydration bladder sleeve, and integrated rain cover.',
        price: 89.99,
        discountPrice: 74.99,
        inventory: 18,
        imageUrl: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=600&q=80',
        cat: sports,
        tags: ['backpack', 'hiking', 'camping', 'sports', 'blue'],
        ratings: { average: 4.6, count: 83 },
        colors: ['blue', 'black'],
      },
      {
        title: 'Carbon Fiber Tennis Racket',
        description: 'Lightweight graphitic tennis racquet with enlarged sweet spot and pre-strung durable synthetic gut.',
        price: 119.99,
        discountPrice: 99.99,
        inventory: 15,
        imageUrl: 'https://images.unsplash.com/photo-1617083934555-56321287959b?w=600&q=80',
        cat: sports,
        tags: ['racket', 'tennis', 'sports', 'outdoors', 'yellow'],
        ratings: { average: 4.7, count: 39 },
        colors: ['yellow', 'black'],
      },
      {
        title: 'Speed Jump Rope with Ball Bearings',
        description: 'Tangle-free steel wire jump rope with non-slip aluminum handles. Optimized for cardio and crossfit training.',
        price: 14.99,
        discountPrice: 0,
        inventory: 65,
        imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&q=80',
        cat: sports,
        tags: ['jumprope', 'cardio', 'fitness', 'sports', 'red'],
        ratings: { average: 4.5, count: 128 },
        colors: ['red', 'black'],
      },
      {
        title: '21-Speed All-Terrain Mountain Bike',
        description: 'Dual disc brake mountain bicycle featuring lightweight aluminum frame and front suspension fork for rough trails.',
        price: 449.99,
        discountPrice: 399.99,
        inventory: 6,
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80',
        cat: sports,
        tags: ['bike', 'bicycle', 'cycling', 'sports', 'black'],
        ratings: { average: 4.8, count: 94 },
        colors: ['black', 'orange'],
      },
      {
        title: '3-Season Cold Weather Sleeping Bag',
        description: 'Waterproof mummy sleeping bag rated down to 20°F (-7°C). Includes compression sack for easy packing.',
        price: 49.99,
        discountPrice: 39.99,
        inventory: 25,
        imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&q=80',
        cat: sports,
        tags: ['sleepingbag', 'camping', 'outdoors', 'sports', 'orange'],
        ratings: { average: 4.4, count: 52 },
        colors: ['orange', 'gray'],
      },
      {
        title: 'Latex Fitness Resistance Loop Bands Set',
        description: 'Set of 5 color-coded resistance bands ranging from X-Light to X-Heavy. Great for physical therapy and strength routines.',
        price: 18.99,
        discountPrice: 0,
        inventory: 70,
        imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80',
        cat: sports,
        tags: ['bands', 'resistance', 'fitness', 'sports', 'multicolor'],
        ratings: { average: 4.6, count: 190 },
        colors: ['multicolor'],
      },

      // BEAUTY & WELLNESS (6 Items)
      {
        title: 'Hydrating Hyaluronic Acid Serum 50ml',
        description: 'Deeply moisturizing facial serum infused with pure hyaluronic acid and Vitamin B5. Restores skin elasticity and glow.',
        price: 28.99,
        discountPrice: 24.99,
        inventory: 40,
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
        cat: beauty,
        tags: ['serum', 'skincare', 'beauty', 'wellness', 'clear'],
        ratings: { average: 4.9, count: 230 },
        colors: ['clear'],
      },
      {
        title: 'Ionic Hair Dryer 1800W',
        description: 'Fast drying professional hair dryer featuring negative ion technology that reduces frizz and preserves natural shine.',
        price: 69.99,
        discountPrice: 59.99,
        inventory: 20,
        imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
        cat: beauty,
        tags: ['hairdryer', 'styling', 'beauty', 'electronics', 'pink'],
        ratings: { average: 4.7, count: 115 },
        colors: ['pink', 'black'],
      },
      {
        title: 'Sonic Electric Toothbrush with 4 Heads',
        description: '40,000 VPM sonic motor electric toothbrush with 5 cleaning modes and 2-minute smart timer.',
        price: 39.99,
        discountPrice: 32.99,
        inventory: 35,
        imageUrl: 'https://images.unsplash.com/photo-1559591937-e58af106b274?w=600&q=80',
        cat: beauty,
        tags: ['toothbrush', 'dental', 'beauty', 'electronics', 'white'],
        ratings: { average: 4.8, count: 148 },
        colors: ['white', 'black'],
      },
      {
        title: 'Luxury Botanical Eau De Parfum 100ml',
        description: 'Captivating fragrance notes of jasmine, bergamot, and sandalwood. Long-lasting natural essential oil perfume.',
        price: 89.99,
        discountPrice: 74.99,
        inventory: 15,
        imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80',
        cat: beauty,
        tags: ['perfume', 'fragrance', 'beauty', 'wellness', 'gold'],
        ratings: { average: 4.9, count: 86 },
        colors: ['gold'],
      },
      {
        title: 'Waterproof Precision Cordless Beard Trimmer',
        description: 'Self-sharpening titanium blade trimmer with 20 length settings and 90-minute lithium-ion battery life.',
        price: 44.99,
        discountPrice: 37.99,
        inventory: 25,
        imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&q=80',
        cat: beauty,
        tags: ['trimmer', 'grooming', 'beauty', 'electronics', 'black'],
        ratings: { average: 4.6, count: 94 },
        colors: ['black'],
      },
      {
        title: 'Rose Quartz Facial Gua Sha & Roller Tool',
        description: '100% authentic natural rose quartz facial roller set for lymphatic drainage and facial contouring.',
        price: 19.99,
        discountPrice: 0,
        inventory: 50,
        imageUrl: 'https://images.unsplash.com/photo-1608248597263-0057e44a4592?w=600&q=80',
        cat: beauty,
        tags: ['guasha', 'roller', 'skincare', 'beauty', 'pink'],
        ratings: { average: 4.7, count: 162 },
        colors: ['pink'],
      },
    ];

    console.log(`Inserting ${rawProducts.length} products into MongoDB...`);

    let insertedCount = 0;
    for (const p of rawProducts) {
      const slug = p.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '') + '-' + (1000 + insertedCount);

      const embedding = createEmbedding(p.title, p.description, p.cat.name, p.tags);

      await Product.create({
        title: p.title,
        slug: slug,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice || 0,
        inventory: p.inventory,
        images: [
          {
            url: p.imageUrl,
            publicId: `seed_product_${insertedCount + 1}`,
          },
        ],
        category: p.cat._id,
        tags: p.tags,
        ratings: p.ratings,
        visualEmbedding: embedding,
        imageEmbeddings: embedding,
        dominantColors: p.colors || ['black'],
        productTags: p.tags,
        visualKeywords: p.tags,
        isActive: true,
      });

      insertedCount++;
    }

    console.log(`Successfully seeded ${insertedCount} products!`);

    // 4. Seed Checkout Promo Coupons
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
      },
    ]);

    console.log('Seeded 3 promo coupons (WELCOME10, FLAT20, FREESHIP).');
    await CacheService.flush();
    console.log('Cleared query cache for fresh website rendering.');
    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Database Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
