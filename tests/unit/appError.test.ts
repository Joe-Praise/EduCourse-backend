import { describe, it, expect } from 'vitest';
import AppError from '../../src/utils/appError.js';

describe('AppError', () => {
  it('marks 4xx as "fail" and 5xx as "error"', () => {
    expect(new AppError('bad input', 400).status).toBe('fail');
    expect(new AppError('boom', 500).status).toBe('error');
  });

  it('is operational so production may show its message', () => {
    const err = new AppError('not found', 404);
    expect(err.isOperational).toBe(true);
    expect(err.statusCode).toBe(404);
    expect(err).toBeInstanceOf(Error);
  });
});
