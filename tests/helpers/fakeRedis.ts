/**
 * In-memory stand-in for the node-redis client, covering the subset of the
 * API this codebase calls. Lets the full Express app run under Supertest
 * without a Redis server. TTLs are accepted but not enforced.
 */
const store = new Map<string, string>();

const SPECIAL = new Set('.+^${}()|[]\\'.split(''));

/** Redis glob (`*`, `?`) → anchored RegExp. */
const globToRegExp = (glob: string): RegExp => {
  let source = '';
  for (const ch of glob) {
    if (ch === '*') source += '.*';
    else if (ch === '?') source += '.';
    else source += SPECIAL.has(ch) ? `\\${ch}` : ch;
  }
  return new RegExp(`^${source}$`);
};

const matching = (pattern: string): string[] => {
  const re = globToRegExp(pattern);
  return [...store.keys()].filter((k) => re.test(k));
};

export const fakeRedis = {
  isOpen: true,
  async connect(): Promise<void> {},
  on(): typeof fakeRedis {
    return fakeRedis;
  },
  async get(key: string): Promise<string | null> {
    return store.get(key) ?? null;
  },
  async set(key: string, value: string): Promise<'OK'> {
    store.set(key, value);
    return 'OK';
  },
  async del(keys: string | string[]): Promise<number> {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.reduce((n, k) => n + (store.delete(k) ? 1 : 0), 0);
  },
  async keys(pattern: string): Promise<string[]> {
    return matching(pattern);
  },
  async ttl(key: string): Promise<number> {
    return store.has(key) ? 300 : -2;
  },
  async scan(_cursor: string, opts: { MATCH: string }): Promise<{ cursor: string; keys: string[] }> {
    return { cursor: '0', keys: matching(opts.MATCH) };
  },
  async *scanIterator(opts: { MATCH: string }): AsyncGenerator<string> {
    yield* matching(opts.MATCH);
  },
  async sendCommand(): Promise<null> {
    return null;
  },
  flushAll(): void {
    store.clear();
  },
};
