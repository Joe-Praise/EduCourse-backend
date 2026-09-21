export declare const cache: {
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    del(...keys: string[]): Promise<void>;
    delByPrefix(prefix: string): Promise<void>;
};
//# sourceMappingURL=cache.d.ts.map