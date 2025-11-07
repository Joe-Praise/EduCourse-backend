import redis from "./redis.js";

const DEFAULT_TTL = 60 * 60; // 1 hour in seconds

export const cache = {
  async set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    await redis.set(key, JSON.stringify(value), { EX: ttl });
  },

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    console.log('coming from cache: ', data);
    return data ? (JSON.parse(data) as T) : null;
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },

  async delByPrefix(prefix: string): Promise<void> {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },
};
