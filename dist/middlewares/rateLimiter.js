// middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";
// Global limiter
export const globalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
        prefix: "rl:global:",
    }),
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
});
// Auth limiter (more strict)
export const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
        prefix: "rl:auth:",
    }),
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again later.",
});
// AI limiter — 10 requests per minute per IP
export const aiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
        prefix: "rl:ai:",
    }),
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many AI requests. Please wait before trying again.",
});
//# sourceMappingURL=rateLimiter.js.map