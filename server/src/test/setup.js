const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Set up mock test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_jwt_sign';
process.env.JWT_REFRESH_SECRET = 'test_secret_jwt_refresh_sign';
process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
process.env.CLOUDINARY_API_KEY = 'mock_key';
process.env.CLOUDINARY_API_SECRET = 'mock_secret';
process.env.PORT = '5001';

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect Mongoose to the memory db instance
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Disconnect mongoose and stop MongoDB memory server instance
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clear all DB collections to ensure test isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});
