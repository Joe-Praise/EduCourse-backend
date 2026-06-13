import { logger } from '../utils/logger.js';
import redis from "./redis.js";
const DEFAULT_TTL = 60 * 60; // 1 hour in seconds
export const cache = {
    async set(key, value, ttl = DEFAULT_TTL) {
        await redis.set(key, JSON.stringify(value), { EX: ttl });
    },
    async get(key) {
        const data = (await redis.get(key));
        logger.debug('coming from cache: ', data);
        return data ? JSON.parse(data) : null;
    },
    async del(...keys) {
        if (keys.length > 0) {
            await redis.del(keys);
        }
    },
    async delByPrefix(prefix) {
        const keys = await redis.keys(`${prefix}*`);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    },
};
//# sourceMappingURL=cache.js.map