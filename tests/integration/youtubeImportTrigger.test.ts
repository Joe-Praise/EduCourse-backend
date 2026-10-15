import '../helpers/mocks.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import app from '../../src/app.js';
import * as agentService from '../../src/services/agentService.js';
import { Course } from '../../src/models/courseModel.js';
import { User } from '../../src/models/userModel.js';
import { fakeRedis } from '../helpers/fakeRedis.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

// GET /courses?search=<q> with no catalog match creates an 'importing' draft and
// dispatches youtube-course-discovery — for signed-in users only. These cover the
// paths that used to leave the draft 'importing' forever, which blocked every
// later search for <q>, and the sign-in gate.

const QUERY = 'scaffold inspection';
let userId: Types.ObjectId;
const bearer = () =>
  `Bearer ${jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET!, { expiresIn: '5m' })}`;
const searchAnon = () => request(app).get(`/api/v1/courses?search=${encodeURIComponent(QUERY)}`);
const search = () => searchAnon().set('Authorization', bearer());

const accepted = { accepted: true, projectId: 'building-safety', agentType: 'youtube-course-discovery' };

const drafts = () =>
  Course.find({ importQuery: QUERY }).setOptions({ skipPublishedFilter: true }).sort({ createdAt: 1 }).lean();

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  fakeRedis.flushAll();
  userId = new Types.ObjectId();
  await User.collection.insertOne({
    _id: userId, name: 'Learner', email: 'learner@example.com', role: ['user'], active: true,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('YouTube auto-import trigger', () => {
  it('never starts an import for an anonymous search', async () => {
    const trigger = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(accepted);

    const res = await searchAnon();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.importing).toBeUndefined();
    expect(trigger).not.toHaveBeenCalled();
    expect(await drafts()).toHaveLength(0);
  });

  it('shows anonymous searches a published import but never a draft', async () => {
    const base = { description: 'd', importQuery: QUERY, priceCategory: 'Free', active: true };
    await Course.collection.insertOne({ ...base, title: 'Draft', publishedStatus: 'importing', createdAt: new Date() });
    expect((await searchAnon()).body.data).toEqual([]);

    await Course.collection.insertOne({ ...base, title: 'Live', publishedStatus: 'published', createdAt: new Date() });
    const res = await searchAnon();

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['Live']);
  });

  it('returns 202 with an importing draft when the agent accepts the job', async () => {
    const trigger = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(accepted);

    const res = await search();

    expect(res.status).toBe(202);
    expect(res.body.importing).toBe(true);
    expect(trigger).toHaveBeenCalledWith(
      'youtube-course-discovery',
      expect.objectContaining({ courseQuery: QUERY, initiatedBy: `user:${userId.toString()}` }),
      expect.any(String),
    );
    const [draft] = await drafts();
    expect(draft.publishedStatus).toBe('importing');
  });

  it('marks the draft failed and returns 503 when the agent dispatch fails', async () => {
    vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);

    const res = await search();

    expect(res.status).toBe(503);
    const [draft] = await drafts();
    expect(draft.publishedStatus).toBe('failed');
  });

  it('retries on the next search after a failed dispatch', async () => {
    const trigger = vi
      .spyOn(agentService, 'safeTriggerAgent')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(accepted);

    expect((await search()).status).toBe(503);
    const res = await search();

    expect(res.status).toBe(202);
    expect(trigger).toHaveBeenCalledTimes(2);
  });

  it('returns a fresh importing draft without re-triggering', async () => {
    const trigger = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(accepted);

    await search();
    const res = await search();

    expect(res.status).toBe(200);
    expect(res.body.importing).toBe(true);
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it('marks a stale importing draft failed and re-triggers the import', async () => {
    const trigger = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(accepted);
    const staleId = (
      await Course.collection.insertOne({
        title: QUERY,
        description: 'stuck draft',
        publishedStatus: 'importing',
        importQuery: QUERY,
        priceCategory: 'Free',
        active: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      })
    ).insertedId;

    const res = await search();

    expect(res.status).toBe(202);
    expect(trigger).toHaveBeenCalledTimes(1);
    const all = await drafts();
    expect(all.find((d) => d._id.equals(staleId))?.publishedStatus).toBe('failed');
    expect(all.filter((d) => d.publishedStatus === 'importing')).toHaveLength(1);
  });

  it('does not re-trigger when a concurrent request already claimed the stale draft', async () => {
    const trigger = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(accepted);
    const base = { title: QUERY, description: 'd', importQuery: QUERY, priceCategory: 'Free', active: true };
    // State after the winning request: stale draft claimed, fresh retry in flight.
    const staleId = (
      await Course.collection.insertOne({
        ...base,
        publishedStatus: 'failed',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      })
    ).insertedId;
    const winnerId = (
      await Course.collection.insertOne({ ...base, publishedStatus: 'importing', createdAt: new Date() })
    ).insertedId;
    // This (losing) request read the stale draft before the winner claimed it.
    const staleSnapshot = {
      _id: staleId,
      publishedStatus: 'importing',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    };
    vi.spyOn(Course, 'findOne').mockImplementationOnce(
      () => ({ setOptions: () => Promise.resolve(staleSnapshot) }) as never,
    );

    const res = await search();

    expect(res.status).toBe(200);
    expect(res.body.importing).toBe(true);
    expect(res.body.data[0]._id).toBe(winnerId.toString());
    expect(trigger).not.toHaveBeenCalled();
    expect(await drafts()).toHaveLength(2);
  });
});
