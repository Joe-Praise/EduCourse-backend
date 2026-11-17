import { logger } from '../utils/logger.js';
import { createClient, type RedisClientType } from "redis";

const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// info/debug are silenced in production, so a recovery after failed attempts
// is logged at warn — otherwise a transient startup timeout is
// indistinguishable from a permanent outage in the Render logs.
let failedAttempts = 0;

redis.on("connect", () => logger.debug("✅ Connected to Redis"));
redis.on("ready", () => {
  if (failedAttempts > 0) {
    logger.warn(`✅ Redis ready after ${failedAttempts} failed connection attempt(s)`);
    failedAttempts = 0;
  }
});
redis.on("error", (err) => {
  failedAttempts += 1;
  logger.error("❌ Redis Client Error", err);
});

// Connect immediately (top-level await not allowed in commonjs, so we use .connect())
(async () => {
  try {
    await redis.connect();
  } catch (err) {
    logger.error("❌ Redis connection failed:", err);
  }
})();

export default redis;
