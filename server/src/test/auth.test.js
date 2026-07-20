const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Authentication API Endpoint Tests', () => {
  const mockUser = {
    name: 'Test Customer',
    email: 'customer.test@example.com',
    password: 'Password123!',
  };

  test('POST /api/v1/auth/register - fails with weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: mockUser.name,
        email: mockUser.email,
        password: 'weak',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/register - succeeds with strong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(mockUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('successful');
  });

  test('POST /api/v1/auth/login - fails with unverified email', async () => {
    await User.create({
      ...mockUser,
      emailVerified: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login - succeeds with correct verified password', async () => {
    await User.create({
      ...mockUser,
      emailVerified: true,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });
});
