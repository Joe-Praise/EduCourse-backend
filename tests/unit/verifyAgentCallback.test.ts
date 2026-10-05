import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { verifyAgentCallback, safeCompare } from '../../src/middlewares/verifyAgentCallback.js';

function run(headerValue?: string | string[]) {
  const req = { headers: headerValue === undefined ? {} : { 'x-agent-api-key': headerValue } } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn() as unknown as NextFunction;
  verifyAgentCallback(req, res as unknown as Response, next);
  return { res, next };
}

describe('safeCompare', () => {
  it('matches equal strings and rejects different ones of any length', () => {
    expect(safeCompare('abc', 'abc')).toBe(true);
    expect(safeCompare('abc', 'abd')).toBe(false);
    expect(safeCompare('abc', 'abcd')).toBe(false);
    expect(safeCompare('', 'abc')).toBe(false);
  });
});

describe('verifyAgentCallback', () => {
  afterEach(() => {
    process.env.AGENT_API_KEY = 'test-agent-api-key';
  });

  it('calls next() for the correct key', () => {
    const { res, next } = run('test-agent-api-key');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', undefined],
    ['wrong', 'nope'],
    ['prefix of the key', 'test-agent'],
    ['array header', ['test-agent-api-key']],
  ])('rejects a %s key with 401', (_label, value) => {
    const { res, next } = run(value as string | string[] | undefined);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('fails closed with 500 when the server key is not configured', () => {
    delete process.env.AGENT_API_KEY;
    const { res, next } = run('anything');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
