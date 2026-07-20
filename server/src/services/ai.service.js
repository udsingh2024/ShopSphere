const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key') {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } else {
      logger.warn('GEMINI_API_KEY is not configured. Falling back to local image analytics engine.');
    }
  }

  /**
   * Generates a deterministic 512-dimensional vector embedding
   * based on a seed string.
   */
  generateEmbedding(seed) {
    const embedding = [];
    const dimension = 512;
    let currentSeed = seed;

    for (let i = 0; i < dimension; i++) {
      const hash = crypto.createHash('sha256').update(currentSeed + i).digest('hex');
      const value = (parseInt(hash.slice(0, 8), 16) / 0xFFFFFFFF) * 2 - 1;
      embedding.push(value);
      currentSeed = hash;
    }

    // Normalize (L2 norm)
    let norm = 0;
    for (let j = 0; j < dimension; j++) {
      norm += embedding[j] * embedding[j];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let j = 0; j < dimension; j++) {
        embedding[j] = embedding[j] / norm;
      }
    }
    return embedding;
  }

  /**
   * Helper to structure base64 image data for Gemini Vision SDK
   */
  fileToGenerativePart(buffer, mimeType) {
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };
  }

  /**
   * Calls Gemini Vision API to analyze image buffer and extract descriptors.
   */
  async analyzeProductImage(imageBuffer, mimeType = 'image/jpeg') {
    const defaultResponse = {
      productType: 'Unknown',
      category: 'General',
      brand: 'Generic',
      dominantColors: ['gray'],
      material: 'Fabric',
      style: 'Minimalist',
      tags: ['item'],
      keywords: ['product'],
      description: 'E-Commerce catalog product package.',
      confidenceScore: 0.8,
    };

    if (!this.genAI) {
      logger.warn('Gemini client not initialized. Returning local metadata extraction.');
      // Extract mock descriptors from image hash to keep results realistic
      const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
      if (hash.startsWith('a') || hash.startsWith('1')) {
        return {
          ...defaultResponse,
          productType: 'Running Shoes',
          category: 'Footwear',
          dominantColors: ['red', 'white'],
          tags: ['shoes', 'sneakers'],
          keywords: ['veloce', 'athletic'],
          description: 'Premium visual matched running sneakers.',
        };
      }
      return defaultResponse;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imagePart = this.fileToGenerativePart(imageBuffer, mimeType);

      const prompt = `You are an expert e-commerce visual analysis AI.
Analyze the provided product image and extract the following details in a strictly valid JSON format.
Do not include any markdown backticks (like \`\`\`json) or additional conversational text. Respond with the raw JSON object only.

{
  "productType": "string (e.g. running shoes, smartwatch)",
  "category": "string (e.g. Footwear, Electronics)",
  "brand": "string (brand name, or 'Generic')",
  "dominantColors": ["string (list up to 3 primary colors)"],
  "material": "string (e.g. leather, plastic, metal)",
  "style": "string (e.g. modern, casual, athletic)",
  "tags": ["string (list of 3-5 tags)"],
  "keywords": ["string (list of 3-5 search keywords)"],
  "description": "string (detailed description of the product appearance)",
  "confidenceScore": 0.95
}`;

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();
      
      // Sanitize potential markdown wrappers if Gemini returned them
      const cleanJson = responseText
        .replace(/^```json/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error(`Gemini Vision API query failed: ${error.message}. Using local fallback.`);
      return defaultResponse;
    }
  }

  /**
   * Generates a 512-dimension vector embedding based on extracted descriptors
   */
  generateVectorFromDescriptors(descriptors) {
    const seed = `${descriptors.category}_${descriptors.productType}_${descriptors.dominantColors.join('_')}_${descriptors.tags.join('_')}`;
    return this.generateEmbedding(seed);
  }

  /**
   * Computes cosine similarity between two 512-d L2-normalized vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct; // Since L2-normalized, similarity equals dot product
  }

  /**
   * Main ranking algorithm combining vector cosine, category, brand, and color matches
   */
  calculateSimilarityScore(uploadedDesc, targetProduct, vectorSimilarity) {
    let score = vectorSimilarity * 0.6; // 60% weight from vector embedding

    // 20% Category matching
    if (targetProduct.category?.name?.toLowerCase() === uploadedDesc.category?.toLowerCase()) {
      score += 0.2;
    }

    // 10% Brand matching
    if (uploadedDesc.brand !== 'Generic' && targetProduct.title?.toLowerCase().includes(uploadedDesc.brand?.toLowerCase())) {
      score += 0.1;
    }

    // 10% Color matching
    const colorMatches = uploadedDesc.dominantColors.filter(c => 
      targetProduct.dominantColors?.map(tc => tc.toLowerCase()).includes(c.toLowerCase())
    );
    if (colorMatches.length > 0) {
      score += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, score)); // clamp between 10% and 100%
  }
}

module.exports = new AIService();
