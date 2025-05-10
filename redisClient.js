const redis = require("redis");

const redisClient = redis.createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD || "",
  socket: {
    host: process.env.REDIS_HOST || "redis://localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  legacyMode: true,
});
redisClient.connect().catch(console.error);
module.exports = redisClient;
