import { describe, it, expect } from 'vitest';
import { CacheKeyBuilder } from '../../src/utils/cacheKeyBuilder.js';

describe('CacheKeyBuilder', () => {
  it('builds resource keys', () => {
    expect(CacheKeyBuilder.resourceKey('course', '42')).toBe('cache:course:42');
  });

  it('gives the same list key regardless of query-param order', () => {
    expect(CacheKeyBuilder.listKey('course', { page: '1', sort: '-price' })).toBe(
      CacheKeyBuilder.listKey('course', { sort: '-price', page: '1' }),
    );
  });

  it('gives different list keys for different queries', () => {
    expect(CacheKeyBuilder.listKey('course', { page: '1' })).not.toBe(
      CacheKeyBuilder.listKey('course', { page: '2' }),
    );
  });

  it('produces a pattern that matches every key of a resource', () => {
    const re = new RegExp(`^${CacheKeyBuilder.pattern('course').replace('*', '.*')}$`);
    expect(re.test(CacheKeyBuilder.resourceKey('course', '1'))).toBe(true);
    expect(re.test(CacheKeyBuilder.listKey('course', { page: '1' }))).toBe(true);
  });
});
