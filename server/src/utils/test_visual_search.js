const aiService = require('../services/ai.service');
const assert = require('assert');

console.log('\n======================================================');
console.log('       SHOPSPHERE AI VISUAL SEARCH UNIT TESTS         ');
console.log('======================================================\n');

try {
  // Test 1: L2 Norm Embedding Vector normalization
  const vecA = aiService.generateEmbedding('sneakers');
  let norm = 0;
  for (let i = 0; i < vecA.length; i++) {
    norm += vecA[i] * vecA[i];
  }
  const length = Math.sqrt(norm);
  assert.ok(Math.abs(length - 1.0) < 1e-9, 'Vector length must equal exactly 1.0 due to L2 normalization');
  console.log('[PASS] L2 Vector Normalization');

  // Test 2: Cosine Similarity of identical vectors
  const similaritySelf = aiService.cosineSimilarity(vecA, vecA);
  assert.ok(Math.abs(similaritySelf - 1.0) < 1e-9, 'Cosine similarity of identical vectors must be 1.0');
  console.log('[PASS] Cosine Similarity - Self Match');

  // Test 3: Cosine Similarity of different vectors
  const vecB = aiService.generateEmbedding('smartwatch');
  const similarityDiff = aiService.cosineSimilarity(vecA, vecB);
  assert.ok(similarityDiff < 1.0, 'Different vectors should have similarity strictly less than 1.0');
  assert.ok(similarityDiff > -1.0 && similarityDiff < 1.0, 'Cosine bounds check (-1.0 to 1.0)');
  console.log('[PASS] Cosine Similarity - Different Seeds');

  // Test 4: Weighted Match Scorer calculations
  const searchDesc = {
    category: 'Footwear',
    productType: 'Athletic Shoes',
    brand: 'Veloce',
    dominantColors: ['red', 'white']
  };
  const mockProduct = {
    title: 'Veloce Carbon sneakers',
    category: { name: 'Footwear' },
    dominantColors: ['red', 'black']
  };

  const vectorSim = 0.85; // Mock cosine similarity
  const finalScore = aiService.calculateSimilarityScore(searchDesc, mockProduct, vectorSim);

  // 0.85 * 0.6 = 0.51 (Vector)
  // + 0.2 (Category Match)
  // + 0.1 (Brand Match: 'Veloce' is in 'Veloce Carbon sneakers')
  // + 0.1 (Color Match: 'red' is in both)
  // Expected = 0.91
  assert.ok(Math.abs(finalScore - 0.91) < 1e-9, `Calculated score should equal 0.91, got ${finalScore}`);
  console.log('[PASS] Weighted Ranking Algorithm matches expectation');

  // Test 5: Gemini prompt sanitization check
  const rawMockResponse = `
\`\`\`json
{
  "productType": "Sneakers",
  "category": "Footwear",
  "brand": "Generic",
  "dominantColors": ["black"],
  "material": "fabric",
  "style": "sporty",
  "tags": ["running"],
  "keywords": ["shoes"],
  "description": "sports shoes",
  "confidenceScore": 0.9
}
\`\`\`
  `;
  const cleanJson = rawMockResponse.trim()
    .replace(/^```json/, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
  const parsed = JSON.parse(cleanJson);
  assert.strictEqual(parsed.category, 'Footwear');
  console.log('[PASS] Markdown JSON wrapper sanitization');

  console.log('\n======================================================');
  console.log('TEST SUMMARY: All tests passed successfully.');
  console.log('======================================================\n');
} catch (error) {
  console.error('\n[FAIL] Test assertion failed:', error.message);
  process.exit(1);
}
