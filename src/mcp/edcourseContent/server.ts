import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import {
  INPUT_SCHEMA,
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_DESCRIPTION,
  TOOL_NAME,
} from './contract.js';
import { getModuleLessons, type ToolDeps } from './tool.js';

/**
 * The low-level SDK `Server` is used (not `McpServer`) so the advertised input
 * schema is the ratified JSON verbatim rather than a zod-to-JSON conversion.
 * The tool list is static: exactly one tool, no runtime discovery.
 */

const TOOL: Tool = {
  name: TOOL_NAME,
  description: TOOL_DESCRIPTION,
  inputSchema: JSON.parse(JSON.stringify(INPUT_SCHEMA)) as Tool['inputSchema'],
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export function createEdcourseContentServer(deps?: ToolDeps): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [TOOL] }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== TOOL_NAME) {
      throw new McpError(ErrorCode.InvalidParams, 'Unknown tool');
    }
    return getModuleLessons(request.params.arguments, deps);
  });

  return server;
}
