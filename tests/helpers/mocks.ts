import { vi } from 'vitest';

/**
 * Swaps every Redis-backed module for an in-memory equivalent. Call at the top
 * of an integration test file, before importing the app.
 */
vi.mock('../../src/config/redis.js', async () => {
  const { fakeRedis } = await import('./fakeRedis.js');
  return { default: fakeRedis };
});

vi.mock('../../src/config/redisSession.js', async () => {
  const session = (await import('express-session')).default;
  return {
    sessionMiddleware: session({
      secret: 'test-session-secret',
      resave: false,
      saveUninitialized: false,
    }),
  };
});

vi.mock('../../src/middlewares/rateLimiter.js', () => {
  const passThrough = (_req: unknown, _res: unknown, next: () => void) => next();
  return { globalLimiter: passThrough, authLimiter: passThrough, aiLimiter: passThrough };
});
