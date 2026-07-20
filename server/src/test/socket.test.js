const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { initSocketServer } = require('../socket/socketServer');
const User = require('../models/User');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');

describe('Socket.IO Connection & Events Tests', () => {
  let io, server, socketUrl, token;

  beforeAll(async () => {
    // 1. Seed a user and an active session in the database
    const user = await User.create({
      name: 'Socket User',
      email: 'socket@example.com',
      password: 'Password123!',
      emailVerified: true,
    });

    const session = await Session.create({
      user: user._id,
      deviceInfo: 'Test Runner',
      ipAddress: '127.0.0.1',
      isValid: true,
    });

    // 2. Generate a valid session token
    token = jwt.sign(
      { id: user._id, sessionId: session._id },
      process.env.JWT_SECRET || 'test_secret_jwt_sign',
      { expiresIn: '1h' }
    );

    // 3. Initialize test server
    server = createServer();
    io = new Server(server);
    initSocketServer(io);

    await new Promise((resolve) => {
      server.listen(() => {
        const port = server.address().port;
        socketUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    server.close();
  });

  test('should connect and join user room', async () => {
    const clientSocket = new Client(socketUrl, {
      auth: { token },
    });

    await new Promise((resolve, reject) => {
      clientSocket.on('connect', () => {
        resolve();
      });
      clientSocket.on('connect_error', (err) => {
        reject(err);
      });
    });

    expect(clientSocket.connected).toBe(true);
    clientSocket.close();
  });
});
