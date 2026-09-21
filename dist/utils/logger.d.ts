/**
 * Tiny console wrapper that gates dev-debug noise behind NODE_ENV.
 *
 * Use:
 *   - logger.debug() / logger.info()  → silenced in production, used in development
 *   - logger.warn()                    → always logged
 *   - logger.error()                   → always logged
 *
 * For high-volume production logging, replace with Pino or Winston. This is a
 * minimal abstraction so we have ONE place to swap it later.
 */
export declare const logger: {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};
//# sourceMappingURL=logger.d.ts.map