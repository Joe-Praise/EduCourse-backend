/**
 * Display all cached permissions in a readable format
 */
export declare const displayPermissionCache: () => Promise<void>;
/**
 * Clean up expired cache entries (Redis should handle this automatically)
 */
export declare const cleanExpiredCache: () => Promise<number>;
/**
 * Monitor cache hit/miss ratios (simulation for demonstration)
 */
export declare const monitorCacheMetrics: () => Promise<{
    totalKeys: number;
    avgTTL: number;
    userDistribution: Record<string, number>;
}>;
/**
 * Export cache data for backup/analysis
 */
export declare const exportCacheData: () => Promise<Array<{
    key: string;
    value: boolean;
    ttl: number;
    userId: string;
    roles: string;
    resource: string;
    action: string;
}>>;
/**
 * Test cache performance
 */
export declare const testCachePerformance: (iterations?: number) => Promise<{
    avgWriteTime: number;
    avgReadTime: number;
    avgDeleteTime: number;
}>;
//# sourceMappingURL=redisCacheUtils.d.ts.map