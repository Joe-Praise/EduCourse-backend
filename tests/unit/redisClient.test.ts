import { describe, it, expect, vi, beforeEach } from 'vitest';
const fakeClient = await vi.hoisted(async () => {
  const { EventEmitter } = await import('node:events');
  return Object.assign(new EventEmitter(), {
    connect: () => Promise.resolve(),
  });
});

vi.mock('redis', () => ({ createClient: () => fakeClient }));

import { logger } from '../../src/utils/logger.js';
import '../../src/config/redis.js';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(logger, 'error').mockImplementation(() => undefined);
});

describe('redis client lifecycle logging', () => {
  it('stays quiet on a first-try connection', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    fakeClient.emit('ready');

    expect(warn).not.toHaveBeenCalled();
  });

  it('logs a warn-level recovery after failed attempts, once', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    fakeClient.emit('error', new Error('Connection timeout'));
    fakeClient.emit('error', new Error('Connection timeout'));
    fakeClient.emit('ready');
    fakeClient.emit('ready');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('✅ Redis ready after 2 failed connection attempt(s)');
  });
});
