export declare const cacheManager: {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    updateList<T extends {
        _id: string;
    }>(key: string, item: T, ttlSeconds?: number): Promise<void>;
    addToList<T>(key: string, item: T, ttlSeconds?: number): Promise<void>;
    remove(key: string): Promise<void>;
    /**
     * Delete every key matching a glob pattern (e.g. "cache:course*").
     * Uses SCAN (non-blocking) so it's safe on large keyspaces. Use this to
     * invalidate all query/list variants of a resource after a write that the
     * per-key list helpers can't reach (e.g. an AI course import).
     */
    removePattern(pattern: string): Promise<void>;
};
//# sourceMappingURL=cacheManager.d.ts.map