import '../helpers/mocks.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { RefreshToken } from '../../src/models/refreshTokenModel.js';
import { fakeRedis } from '../helpers/fakeRedis.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

const USER = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'correct-horse-battery',
  confirmPassword: 'correct-horse-battery',
};

/** Pulls a cookie value out of a Set-Cookie header list. */
function cookie(res: request.Response, name: string): string | undefined {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  const line = header?.find((c) => c.startsWith(`${name}=`));
  const value = line?.split(';')[0].slice(name.length + 1);
  return value || undefined;
}

const refresh = (rt: string) =>
  request(app).post('/api/v1/users/refresh').set('Cookie', `rt=${rt}`);

async function signupAndLogin(): Promise<request.Response> {
  await request(app).post('/api/v1/users/signup').send(USER).expect(201);
  return request(app)
    .post('/api/v1/users/login')
    .send({ email: USER.email, password: USER.password })
    .expect(200);
}

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  fakeRedis.flushAll();
});

describe('login', () => {
  it('issues an access token and an httpOnly, path-scoped refresh cookie', async () => {
    const res = await signupAndLogin();

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.data.user.password).toBeUndefined();

    const rtLine = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('rt='))!;
    expect(rtLine).toMatch(/HttpOnly/i);
    expect(rtLine).toMatch(/Path=\/api\/v1\/users/);
  });

  it('stores only a hash of the refresh token', async () => {
    const res = await signupAndLogin();
    const raw = cookie(res, 'rt')!;

    const stored = await RefreshToken.findOne({});
    expect(stored!.tokenHash).not.toBe(raw);
    expect(stored!.tokenHash).toBe(RefreshToken.hashToken(raw));
  });

  it('rejects a wrong password', async () => {
    await request(app).post('/api/v1/users/signup').send(USER).expect(201);
    await request(app)
      .post('/api/v1/users/login')
      .send({ email: USER.email, password: 'wrong' })
      .expect(401);
  });
});

describe('refresh token rotation', () => {
  it('rotates: a refresh returns a new token and revokes the old one', async () => {
    const rt1 = cookie(await signupAndLogin(), 'rt')!;

    const res = await refresh(rt1).expect(200);
    const rt2 = cookie(res, 'rt')!;

    expect(rt2).toBeDefined();
    expect(rt2).not.toBe(rt1);
    expect(res.body.token).toEqual(expect.any(String));

    const old = await RefreshToken.findOne({ tokenHash: RefreshToken.hashToken(rt1) });
    expect(old!.revoked).toBe(true);
  });

  it('treats reuse of a rotated token as theft and kills every session', async () => {
    const rt1 = cookie(await signupAndLogin(), 'rt')!;
    const rt2 = cookie(await refresh(rt1).expect(200), 'rt')!;

    // Attacker replays the stolen, already-rotated token.
    const replay = await refresh(rt1).expect(401);
    expect(replay.body.message).toMatch(/reused/i);

    // The legitimate user's current token is now dead too.
    await refresh(rt2).expect(401);
    expect(await RefreshToken.countDocuments({ revoked: false })).toBe(0);
  });

  it('lets exactly one of two concurrent refreshes with the same token win', async () => {
    const rt = cookie(await signupAndLogin(), 'rt')!;

    const results = await Promise.all([refresh(rt), refresh(rt)]);
    const statuses = results.map((r) => r.status).sort();

    expect(statuses).toEqual([200, 401]);
  });

  it('rejects an unknown token and a missing cookie', async () => {
    await refresh('not-a-real-token').expect(401);
    await request(app).post('/api/v1/users/refresh').expect(401);
  });

  it('rejects an expired token', async () => {
    const rt = cookie(await signupAndLogin(), 'rt')!;
    await RefreshToken.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

    const res = await refresh(rt).expect(401);
    expect(res.body.message).toMatch(/expired/i);
  });
});

describe('logout', () => {
  it('revokes the refresh token so it cannot be used again', async () => {
    const rt = cookie(await signupAndLogin(), 'rt')!;

    await request(app).post('/api/v1/users/logout').set('Cookie', `rt=${rt}`).expect(200);
    await refresh(rt).expect(401);
  });
});
