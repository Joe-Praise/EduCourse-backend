import session from 'express-session';
import { RedisStore } from "connect-redis";
import redis from './redis.js';

// 1. Create Redis store instance
const redisStore = new RedisStore({
  client: redis,
  prefix: "myapp:sess:", // optional prefix for session keys
  ttl: 60 * 60 * 12, 
});

// 2. Attach to express-session
export const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || "super-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production", // secure only in prod
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // 1 hour
  },
});