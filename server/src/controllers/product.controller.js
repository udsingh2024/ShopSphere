const ProductRepository = require('../repositories/product.repository');
const Category = require('../models/Category');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const AIService = require('../services/ai.service');
const logger = require('../utils/logger');
const CacheService = require('../services/cache.service');
const slugify = require('express'); // We can make a simple slugify utility instead

const slugifyText = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// Stream-based upload helper for Multer buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name'
    ) {
      // Return beautiful mock Unsplash images based on keywords
      const fallbacks = [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', // red shoe
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', // watch
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80', // glasses
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80', // headphones
      ];
      const randomUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      logger.warn('Cloudinary not configured. Mocking image upload.');
      return resolve({
        url: randomUrl,
        publicId: `mock_public_id_${Date.now()}`,
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shopsphere' },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

const getProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
    
    const cacheKey = `products:query:${JSON.stringify({ category, search, minPrice, maxPrice, sort, page, limit })}`;
    const cachedResults = await CacheService.get(cacheKey);
    if (cachedResults) {
      return res.json({
        success: true,
        ...cachedResults,
      });
    }

    const results = await ProductRepository.findAll({
      category,
      search,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
    });

    await CacheService.set(cacheKey, results, 300); // Cache queries for 5 mins

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const cacheKey = `product:${productId}`;
    const cachedProduct = await CacheService.get(cacheKey);
    if (cachedProduct) {
      return res.json({
        success: true,
        product: cachedProduct,
      });
    }

    const product = await ProductRepository.findById(productId, true); // true sets lean search
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    await CacheService.set(cacheKey, product, 900); // Cache product details for 15 mins

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, discountPrice, inventory, category, tags } = req.body;

    // Validate Category existence
    const catExists = await Category.findById(category);
    if (!catExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category ID provided',
      });
    }

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }

    // Upload to Cloudinary
    const images = [];
    for (const file of req.files) {
      const uploaded = await uploadToCloudinary(file.buffer);
      images.push(uploaded);
    }

    const parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags || '[]');

    // Generate AI embedding from product details & main image
    const embeddingSeed = `${title}_${description}_${category}`;
    const visualEmbedding = AIService.generateEmbedding(embeddingSeed);

    // Call Gemini Vision to extract features automatically
    const firstFile = req.files[0];
    let aiAnalysis = {
      productType: title,
      category: catExists.name,
      dominantColors: ['gray'],
      tags: parsedTags,
      keywords: parsedTags,
      description: description
    };
    try {
      aiAnalysis = await AIService.analyzeProductImage(firstFile.buffer, firstFile.mimetype);
    } catch (e) {
      logger.warn(`Failed automatic AI indexing on creation: ${e.message}`);
    }

    const imageEmbeddings = AIService.generateVectorFromDescriptors(aiAnalysis);
    const imageHash = crypto.createHash('md5').update(images[0]?.url || '').digest('hex');
    const slug = `${slugifyText(title)}-${Date.now()}`;

    const product = await ProductRepository.create({
      title,
      slug,
      description,
      price,
      discountPrice,
      inventory,
      images,
      category,
      tags: parsedTags,
      visualEmbedding,
      imageEmbeddings,
      aiDescription: aiAnalysis.description,
      dominantColors: aiAnalysis.dominantColors,
      productTags: aiAnalysis.tags,
      visualKeywords: aiAnalysis.keywords,
      imageHash,
      lastIndexed: new Date()
    });

    logger.info(`Product created: ${product.title} (${product._id})`);
    await CacheService.flush();

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, discountPrice, inventory, category, tags } = req.body;

    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const updateObj = {};
    if (title) {
      updateObj.title = title;
      updateObj.slug = `${slugifyText(title)}-${Date.now()}`;
    }
    if (description) updateObj.description = description;
    if (price) updateObj.price = price;
    if (discountPrice !== undefined) updateObj.discountPrice = discountPrice;
    if (inventory !== undefined) updateObj.inventory = inventory;
    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({ success: false, message: 'Invalid category ID' });
      }
      updateObj.category = category;
    }
    if (tags) {
      updateObj.tags = Array.isArray(tags) ? tags : JSON.parse(tags || '[]');
    }

    // Upload new files if provided
    if (req.files && req.files.length > 0) {
      const images = [];
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file.buffer);
        images.push(uploaded);
      }
      updateObj.images = images;
    }

    // Update embedding if title or category changed
    if (title || category || (req.files && req.files.length > 0)) {
      const embeddingSeed = `${updateObj.title || existingProduct.title}_${updateObj.category || existingProduct.category}`;
      updateObj.visualEmbedding = AIService.generateEmbedding(embeddingSeed);
    }

    const updated = await ProductRepository.update(id, updateObj);

    logger.info(`Product updated: ${updated.title}`);
    await CacheService.del(`product:${id}`);
    await CacheService.flush();

    res.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await ProductRepository.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    logger.info(`Product soft deleted: ${deleted.title}`);
    await CacheService.del(`product:${req.params.id}`);
    await CacheService.flush();
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const visualSearch = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image to perform visual search',
      });
    }

    // Extract embedding vector from uploaded file
    const queryEmbedding = AIService.extractImageFeatures(req.file.buffer, req.file.originalname);

    // Fetch nearest products using cosine similarity
    const matches = await ProductRepository.findSimilarProductsLocal(queryEmbedding);

    res.json({
      success: true,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  visualSearch,
};
