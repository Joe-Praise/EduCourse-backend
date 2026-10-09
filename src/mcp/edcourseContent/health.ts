import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { isMcpEnabled } from '../../middlewares/verifyMcpBearer.js';

/**
 * Liveness/readiness for the MCP service. Reads only in-process state: no DB
 * query, no MCP operation, no tool call, no secrets or content.
 */
export function mcpHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'up' : 'down',
    mcp: isMcpEnabled() ? 'enabled' : 'disabled',
  });
}
