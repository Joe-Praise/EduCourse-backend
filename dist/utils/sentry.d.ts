import * as Sentry from '@sentry/node';
export declare function initSentry(): void;
/**
 * Capture an exception with optional context. Safe to call even if Sentry
 * isn't initialized (becomes a no-op).
 */
export declare function captureException(err: unknown, context?: Record<string, unknown>): void;
export { Sentry };
//# sourceMappingURL=sentry.d.ts.map