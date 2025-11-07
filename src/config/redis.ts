import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis Client Error", err));

// Connect immediately (top-level await not allowed in commonjs, so we use .connect())
(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

export default redis;
