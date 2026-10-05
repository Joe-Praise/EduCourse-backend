import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';

/**
 * Constant-time string comparison. Both sides are hashed first so the buffers
 * are always the same length — `timingSafeEqual` throws on unequal lengths,
 * and an early length check would leak the key's length through timing.
 */
export function safeCompare(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function verifyAgentCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expected = process.env.AGENT_API_KEY;
  const provided = req.headers['x-agent-api-key'];

  if (!expected) {
    logger.error('[verifyAgentCallback] AGENT_API_KEY not configured');
    res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
    return;
  }

  if (!provided || typeof provided !== 'string' || !safeCompare(provided, expected)) {
    res.status(401).json({ status: 'fail', message: 'Unauthorized agent callback' });
    return;
  }

  next();
}
