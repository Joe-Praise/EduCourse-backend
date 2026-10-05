import type { Request } from "express";

/**
 * Centralized utility for generating consistent cache keys across the app.
 * Handles single resources, lists, query strings, and pattern-based invalidation.
 */
export const CacheKeyBuilder = {
  /**
   * 🧱 Single resource key (e.g., cache:courses:12345)
   */
  resourceKey(resource: string, id: string): string {
    return `cache:${resource}:${id}`;
  },

  /**
   * 📜 List or query-based key (e.g., cache:courses:list:{"page":1,"sort":"asc"})
   */
  listKey(resource: string, query?: Record<string, any>): string {
    // Sort keys so ?page=1&sort=x and ?sort=x&page=1 share one cache entry.
    const q = query
      ? JSON.stringify(Object.fromEntries(Object.entries(query).sort(([a], [b]) => a.localeCompare(b))))
      : "";
    return `cache:${resource}:list:${q}`;
  },

  /**
   * 🌐 Request-based key — automatically builds key from Express request
   */
  fromRequest(req: Request): string {
    const base = req.baseUrl.replace("/", "");
    const id = req.params?.id ? `:${req.params.id}` : "";
    const q = Object.keys(req.query).length
      ? `:${JSON.stringify(req.query)}`
      : "";
    return `cache:${base}${id}${q}`;
  },

  /**
   * 🧹 Pattern generator — for invalidating all cache entries related to a resource
   * e.g., CacheKeyBuilder.pattern("courses") → "cache:courses*"
   */
  pattern(resource: string): string {
    return `cache:${resource}*`;
  },

  /**
   * 🧩 Custom builder if you ever need fine control
   */
  custom(parts: (string | number | undefined)[]): string {
    return parts.filter(Boolean).join(":");
  },
};
