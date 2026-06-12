// src/utils/cacheManager.ts

import redis from "../config/redis.js";

export const cacheManager = {
  async get<T = any>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  },

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  },

  async updateList<T extends { _id: string }>(
    key: string,
    item: T,
    ttlSeconds = 300
  ): Promise<void> {
    const list = await this.get<T[]>(key);
    if (list) {
      const updated = list.map((c) => (c._id === item._id ? item : c));
      await this.set(key, updated, ttlSeconds);
    }
  },

  async addToList<T>(key: string, item: T, ttlSeconds = 300): Promise<void> {
    const list = (await this.get<T[]>(key)) || [];
    list.push(item);
    await this.set(key, list, ttlSeconds);
  },

  async remove(key: string): Promise<void> {
    await redis.del(key);
  },

  /**
   * Delete every key matching a glob pattern (e.g. "cache:course*").
   * Uses SCAN (non-blocking) so it's safe on large keyspaces. Use this to
   * invalidate all query/list variants of a resource after a write that the
   * per-key list helpers can't reach (e.g. an AI course import).
   */
  async removePattern(pattern: string): Promise<void> {
    const keys: string[] = [];
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 200 })) {
      keys.push(key as unknown as string);
    }
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },
};