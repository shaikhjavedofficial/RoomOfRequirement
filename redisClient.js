// Redis caching utility
const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  legacyMode: true, // for Node Redis v4 compatibility with callbacks
});
redisClient.connect().catch(console.error);

// No need to promisify, use built-in Promise API in redis v4+

module.exports = redisClient;
