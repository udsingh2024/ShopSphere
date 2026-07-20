const Product = require('../models/Product');

class ProductRepository {
  async findAll({ category, search, minPrice, maxPrice, sort, page = 1, limit = 10 }) {
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const skipIndex = (page - 1) * limit;
    
    // Exclude large AI embeddings arrays from standard catalog views to save network payload size
    let dbQuery = Product.find(query)
      .select('-visualEmbedding -imageEmbeddings')
      .populate('category', 'name slug')
      .skip(skipIndex)
      .limit(Number(limit))
      .lean();

    // Handle Sorting
    if (sort === 'price_asc') {
      dbQuery = dbQuery.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      dbQuery = dbQuery.sort({ price: -1 });
    } else if (sort === 'rating') {
      dbQuery = dbQuery.sort({ 'ratings.average': -1 });
    } else if (search) {
      dbQuery = dbQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    const products = await dbQuery;
    const total = await Product.countDocuments(query);

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
    };
  }

  async findById(id, lean = false) {
    let dbQuery = Product.findById(id).populate('category', 'name slug');
    if (lean) {
      dbQuery = dbQuery.lean();
    }
    return await dbQuery;
  }

  async create(productData) {
    return await Product.create(productData);
  }

  async update(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async delete(id) {
    // We soft-delete by setting isActive to false
    return await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  // AI-Powered Visual search fallback using Javascript-side cosine similarity computation
  async findSimilarProductsLocal(queryEmbedding, limit = 6) {
    // Fetch only the lightweight fields needed for similarity matching and rendering
    const allProducts = await Product.find({ 
      isActive: true, 
      visualEmbedding: { $exists: true, $not: { $size: 0 } } 
    })
      .select('title price discountPrice images category visualEmbedding ratings inventory')
      .populate('category', 'name slug')
      .lean();

    const cosineSimilarity = (vecA, vecB) => {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      const minLength = Math.min(vecA.length, vecB.length);
      for (let i = 0; i < minLength; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const scored = allProducts.map(prod => {
      const score = cosineSimilarity(queryEmbedding, prod.visualEmbedding);
      return { product: prod, score };
    });

    // Sort by descending similarity score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(item => ({
      ...item.product,
      similarityScore: item.score
    }));
  }
}

module.exports = new ProductRepository();
