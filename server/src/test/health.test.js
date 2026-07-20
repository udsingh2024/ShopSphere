const request = require('supertest');
const app = require('../app');

describe('Monitoring & Health Check API Endpoint Tests', () => {
  test('GET /api/v1/health - returns system diagnostics', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.uptime).toBeDefined();
    expect(res.body.memoryUsage).toBeDefined();
  });

  test('GET /api/v1/ready - returns database readiness state', async () => {
    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.checks.database).toBe('connected');
  });

  test('GET /api/v1/version - returns package version', async () => {
    const res = await request(app).get('/api/v1/version');
    expect(res.status).toBe(200);
    expect(res.body.version).toBeDefined();
    expect(res.body.nodeVersion).toBeDefined();
  });
});
