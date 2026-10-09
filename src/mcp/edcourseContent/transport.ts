import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { logger } from '../../utils/logger.js';
import { createEdcourseContentServer } from './server.js';

/**
 * Stateless Streamable HTTP: a fresh server + transport per POST, no session
 * ids, plain JSON responses. Nothing outlives the request.
 */

const jsonRpcError = (code: number, message: string) => ({
  jsonrpc: '2.0',
  error: { code, message },
  id: null,
});

export async function handleMcpPost(req: Request, res: Response): Promise<void> {
  const server = createEdcourseContentServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error('[mcp:edcourse-content] transport failure', {
      errorCategory: err instanceof Error ? err.name : 'unknown',
    });
    if (!res.headersSent) res.status(500).json(jsonRpcError(-32603, 'Internal server error'));
  }
}

/** No server-initiated streams or sessions in stateless mode. */
export function rejectMcpMethod(_req: Request, res: Response): void {
  res.status(405).set('Allow', 'POST').json(jsonRpcError(-32000, 'Method not allowed.'));
}
