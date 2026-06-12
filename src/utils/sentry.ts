import * as Sentry from '@sentry/node';
import { logger } from './logger.js';

/**
 * Sentry initialization. Idempotent + no-op when `SENTRY_DSN` is empty, so
 * local dev works with zero config.
 *
 * Call once at the top of `server.ts`, BEFORE any other import that may throw
 * during module init. The `init` returns synchronously; subsequent imports can
 * use `captureException` directly.
 */
let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.debug('[sentry] SENTRY_DSN not set; skipping init (dev mode)');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Don't send PII by default; flip to true if you need user context.
    sendDefaultPii: false,
  });

  logger.info('[sentry] initialized');
}

/**
 * Capture an exception with optional context. Safe to call even if Sentry
 * isn't initialized (becomes a no-op).
 */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized || !process.env.SENTRY_DSN) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export { Sentry };
