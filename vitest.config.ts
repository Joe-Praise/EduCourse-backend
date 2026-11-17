import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration suites each boot an in-memory MongoDB replica set; running
    // files one at a time keeps memory use and port allocation predictable.
    fileParallelism: false,
    // First run downloads the mongod binary.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-hs256',
      JWT_EXPIRES_IN: '15m',
      SESSION_SECRET: 'test-session-secret',
      AGENT_API_KEY: 'test-agent-api-key',
      EDCOURSE_MCP_BEARER_TOKEN: 'test-mcp-bearer-token-0123456789abcdef',
    },
  },
});
