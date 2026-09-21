import type { Request, Response, NextFunction } from "express";
/**
 * Unified cache invalidator middleware
 * Supports both direct key deletion and pattern-based invalidation.
 */
export declare const cacheInvalidator: (patterns: string | string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=cacheInvalidator.d.ts.map