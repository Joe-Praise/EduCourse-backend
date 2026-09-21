import type { Request } from "express";
/**
 * Centralized utility for generating consistent cache keys across the app.
 * Handles single resources, lists, query strings, and pattern-based invalidation.
 */
export declare const CacheKeyBuilder: {
    /**
     * 🧱 Single resource key (e.g., cache:courses:12345)
     */
    resourceKey(resource: string, id: string): string;
    /**
     * 📜 List or query-based key (e.g., cache:courses:list:{"page":1,"sort":"asc"})
     */
    listKey(resource: string, query?: Record<string, any>): string;
    /**
     * 🌐 Request-based key — automatically builds key from Express request
     */
    fromRequest(req: Request): string;
    /**
     * 🧹 Pattern generator — for invalidating all cache entries related to a resource
     * e.g., CacheKeyBuilder.pattern("courses") → "cache:courses*"
     */
    pattern(resource: string): string;
    /**
     * 🧩 Custom builder if you ever need fine control
     */
    custom(parts: (string | number | undefined)[]): string;
};
//# sourceMappingURL=cacheKeyBuilder.d.ts.map