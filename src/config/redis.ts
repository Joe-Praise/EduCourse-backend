import { logger } from '../utils/logger.js';
import { createClient, type RedisClientType } from "redis";

const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("connect", () => logger.debug("✅ Connected to Redis"));
redis.on("error", (err) => logger.error("❌ Redis Client Error", err));

// Connect immediately (top-level await not allowed in commonjs, so we use .connect())
(async () => {
  try {
    await redis.connect();
  } catch (err) {
    logger.error("❌ Redis connection failed:", err);
  }
})();

export default redis;
