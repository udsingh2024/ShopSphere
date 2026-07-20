const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const Category = require('../models/Category');

describe('Product & Category Catalog API Tests', () => {
  let categoryId;

  test('GET /api/v1/categories - fetches category listings', async () => {
    // Seed a category
    const cat = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
    });
    categoryId = cat._id.toString();

    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].name).toBe('Electronics');
  });

  test('GET /api/v1/products - fetches product catalogs', async () => {
    // Seed a product
    await Product.create({
      title: 'Smartphone',
      slug: 'smartphone',
      description: 'Luxury flagship smartphone device.',
      price: 999,
      inventory: 10,
      category: categoryId,
      images: [{ url: 'http://img.jpg', publicId: 'img1' }],
    });

    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].title).toBe('Smartphone');
  });
});
