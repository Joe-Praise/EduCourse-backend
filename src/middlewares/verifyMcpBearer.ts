import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { safeCompare } from './verifyAgentCallback.js';

/**
 * Guards the edcourse-content MCP endpoint with a service-to-service bearer
 * token (`EDCOURSE_MCP_BEARER_TOKEN`). Runs before body parsing and any DB
 * access. Every auth failure gets the same response, so nothing about courses
 * can be inferred without a valid token. Unset (or too short) token = MCP
 * disabled: fail closed with 503.
 */

export const MCP_TOKEN_MIN_LENGTH = 32;

const BEARER_RE = /^Bearer ([^\s]+)$/;

/** True when a usable token is configured. Never exposes the value. */
export function isMcpEnabled(): boolean {
  const token = process.env.EDCOURSE_MCP_BEARER_TOKEN;
  return typeof token === 'string' && token.length >= MCP_TOKEN_MIN_LENGTH;
}

const jsonRpcError = (code: number, message: string) => ({
  jsonrpc: '2.0',
  error: { code, message },
  id: null,
});

export function verifyMcpBearer(req: Request, res: Response, next: NextFunction): void {
  if (!isMcpEnabled()) {
    logger.error('[verifyMcpBearer] EDCOURSE_MCP_BEARER_TOKEN missing or too short; MCP disabled');
    res.status(503).json(jsonRpcError(-32000, 'MCP service disabled'));
    return;
  }

  const header = req.headers.authorization;
  const match = typeof header === 'string' ? BEARER_RE.exec(header) : null;

  if (!match || !safeCompare(match[1], process.env.EDCOURSE_MCP_BEARER_TOKEN as string)) {
    res.status(401).set('WWW-Authenticate', 'Bearer').json(jsonRpcError(-32001, 'Unauthorized'));
    return;
  }

  next();
}
