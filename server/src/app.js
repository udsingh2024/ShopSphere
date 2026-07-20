require('dotenv').config();

if (process.env.NODE_ENV !== 'test') {
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    console.error(`\x1b[31mFATAL CONFIGURATION ERROR: Missing required environment variables: ${missingEnv.join(', ')}\x1b[0m`);
    process.exit(1);
  }
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const connectDB = async () => {
  const conn = require('./config/db');
  await conn();
};

const logger = require('./utils/logger');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const ChatMessage = require('./models/ChatMessage');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach io to Express application context
app.set('io', io);

// Security and utility Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:", 
        "https://*.cloudinary.com", 
        "https://*.unsplash.com", 
        "https://images.unsplash.com",
        "https://*.razorpay.com"
      ],
      connectSrc: [
        "'self'", 
        "ws://localhost:5000", 
        "wss://localhost:5000",
        "ws://localhost:5001",
        "wss://localhost:5001",
        "http://localhost:5000",
        "http://localhost:5001",
        "https://*.razorpay.com",
        "https://*.cloudinary.com"
      ],
      frameSrc: ["'self'", "https://*.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// NoSQL Injection prevention
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Rate Limiting
const rateLimit = require('express-rate-limit');
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
});
app.use('/api', globalLimiter);

// Base Route
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Welcome to ShopSphere API Server v1',
  });
});

// API Routing Namespace
app.use('/api/v1', apiRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Socket.IO Events Handler
const { initSocketServer } = require('./socket/socketServer');
initSocketServer(io);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`ShopSphere Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
