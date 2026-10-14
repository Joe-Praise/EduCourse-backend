import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('../../src/models/agentRunModel.js', () => ({
  AgentRun: { create: vi.fn().mockResolvedValue(null) },
}));

import { triggerAgent, safeTriggerAgent, describeRejection } from '../../src/services/agentService.js';

const rateLimited = {
  status: 429,
  data: 'Too Many Requests\n',
  headers: {
    'retry-after': '30',
    server: 'edge-proxy',
    'content-type': 'text/plain; charset=utf-8',
    'set-cookie': 'session=do-not-log',
  },
};

beforeEach(() => {
  vi.stubEnv('AGENT_SERVICE_SECRET', 'test-service-secret');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('agent trigger rejection diagnostics', () => {
  it('includes allowlisted headers so the rejecting layer can be identified', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue(rateLimited);

    const err = await triggerAgent('youtube-course-discovery', { initiatedBy: 'api' }).catch((e: Error) => e);

    expect((err as Error).message).toBe(
      'Agent trigger failed (429): "Too Many Requests\\n"' +
        ' [retry-after=30, server=edge-proxy, content-type=text/plain; charset=utf-8]',
    );
    expect((err as Error).message).not.toContain('do-not-log');
  });

  it('dispatches once on 429 and reports failure without retrying', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue(rateLimited);

    const result = await safeTriggerAgent('youtube-course-discovery', { initiatedBy: 'api' });

    expect(result).toBeNull();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('strips line breaks and caps header values', () => {
    const out = describeRejection({ server: `a\r\nb${'x'.repeat(200)}` });
    expect(out).not.toMatch(/[\r\n]/);
    expect(out.length).toBeLessThan(120);
  });

  it('adds nothing when no diagnostic headers are present', () => {
    expect(describeRejection({})).toBe('');
  });
});
