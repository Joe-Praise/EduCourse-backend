// middleware/cacheInvalidator.ts
import type { Request, Response, NextFunction } from "express";
import redis from "../config/redis.js"; // your shared Redis client

/**
 * Unified cache invalidator middleware
 * Supports both direct key deletion and pattern-based invalidation.
 */
export const cacheInvalidator =
  (patterns: string | string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const patternList = Array.isArray(patterns) ? patterns : [patterns];

    // Keep a reference to original res.end
    const oldEnd = res.end;

    res.end = function (...args: any[]) {
      // Restore original end to prevent recursion
      res.end = oldEnd;

      // Run invalidation asynchronously (don't block sending response)
      (async () => {
        // Only run if request was successful
        if ([200, 201, 204].includes(res.statusCode)) {
          try {
            for (const pattern of patternList) {
              // If the pattern has no wildcard, treat as exact key
              if (!pattern.includes("*")) {
                await redis.del(pattern);
                console.log(`🧹 Cache cleared: ${pattern}`);
                continue;
              }

              // Otherwise, perform SCAN-based pattern deletion
              let cursor = "0";
              let totalDeleted = 0;

              do {
                const { cursor: nextCursor, keys } = await redis.scan(cursor, {
                  MATCH: pattern,
                  COUNT: 100, // adjustable based on scale
                });

                cursor = nextCursor;

                if (keys.length > 0) {
                  // redis.del expects individual keys; spread the array
                  await redis.del(keys);
                  totalDeleted += keys.length;
                }
              } while (cursor !== "0");

              console.log(`🧹 Cleared ${totalDeleted} cache entries for pattern: ${pattern}`);
            }
          } catch (error) {
            console.error("❌ Cache invalidation error:", error);
          }
        }
      })();

      // Finally send the response
      // Cast args to the expected parameter tuple for res.end to satisfy TypeScript
      return oldEnd.apply(res, args as unknown as Parameters<typeof oldEnd>);
    };

    next();
  };
