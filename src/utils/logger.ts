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

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  debug: (...args: unknown[]): void => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.debug('[debug]', ...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.info('[info]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.warn('[warn]', ...args);
  },
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error('[error]', ...args);
  },
};
