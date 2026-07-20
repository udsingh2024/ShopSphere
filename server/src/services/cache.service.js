const logger = require('../utils/logger');

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  flush() {
    this.cache.clear();
  }
}

class CacheService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.fallback = new MemoryCache();

    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    if (redisUrl && redisUrl !== 'placeholder') {
      try {
        const redis = require('redis');
        this.client = redis.createClient({ url: redisUrl });
        
        this.client.on('error', (err) => {
          logger.error(`Redis Cache Client Error: ${err.message}`);
          this.isReady = false;
        });

        this.client.on('connect', () => {
          logger.info('Connecting to Redis server...');
        });

        this.client.on('ready', () => {
          logger.info('Redis cache client is ready.');
          this.isReady = true;
        });

        this.client.connect().catch((err) => {
          logger.error(`Failed to connect to Redis, falling back to memory cache: ${err.message}`);
          this.isReady = false;
          this.client = null;
        });
      } catch (err) {
        logger.warn(`Redis module not installed or fail to initialize. Falling back to memory cache.`);
      }
    } else {
      logger.info('No REDIS_URL configured. Using memory cache.');
    }
  }

  async get(key) {
    try {
      if (this.isReady && this.client) {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch (err) {
      logger.error(`Cache get failed: ${err.message}`);
    }
    const localVal = this.fallback.get(key);
    return localVal ? JSON.parse(localVal) : null;
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.isReady && this.client) {
        await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
        return;
      }
    } catch (err) {
      logger.error(`Cache set failed: ${err.message}`);
    }
    this.fallback.set(key, value, ttlSeconds);
  }

  async del(key) {
    try {
      if (this.isReady && this.client) {
        await this.client.del(key);
        return;
      }
    } catch (err) {
      logger.error(`Cache delete failed: ${err.message}`);
    }
    this.fallback.del(key);
  }

  async flush() {
    try {
      if (this.isReady && this.client) {
        await this.client.flushAll();
        return;
      }
    } catch (err) {
      logger.error(`Cache flush failed: ${err.message}`);
    }
    this.fallback.flush();
  }
}

module.exports = new CacheService();
