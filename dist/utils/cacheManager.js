// src/utils/cacheManager.ts
import redis from "../config/redis.js";
export const cacheManager = {
    async get(key) {
        const data = (await redis.get(key));
        return data ? JSON.parse(data) : null;
    },
    async set(key, value, ttlSeconds = 300) {
        await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    },
    async updateList(key, item, ttlSeconds = 300) {
        const list = await cacheManager.get(key);
        if (list) {
            const updated = list.map((c) => (c._id === item._id ? item : c));
            await cacheManager.set(key, updated, ttlSeconds);
        }
    },
    async addToList(key, item, ttlSeconds = 300) {
        const list = (await cacheManager.get(key)) || [];
        list.push(item);
        await cacheManager.set(key, list, ttlSeconds);
    },
    async remove(key) {
        await redis.del(key);
    },
    /**
     * Delete every key matching a glob pattern (e.g. "cache:course*").
     * Uses SCAN (non-blocking) so it's safe on large keyspaces. Use this to
     * invalidate all query/list variants of a resource after a write that the
     * per-key list helpers can't reach (e.g. an AI course import).
     */
    async removePattern(pattern) {
        const keys = [];
        for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 200 })) {
            keys.push(key);
        }
        if (keys.length > 0) {
            await redis.del(keys);
        }
    },
};
//# sourceMappingURL=cacheManager.js.map