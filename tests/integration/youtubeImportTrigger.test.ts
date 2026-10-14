import '../helpers/mocks.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import * as agentService from '../../src/services/agentService.js';
import { Course } from '../../src/models/courseModel.js';
import { fakeRedis } from '../helpers/fakeRedis.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

// GET /courses?search=<q> with no catalog match creates an 'importing' draft and
// dispatches youtube-course-discovery. These cover the paths that used to leave
// the draft 'importing' forever, which blocked every later search for <q>.

const QUERY = 'scaffold inspection';
const search = () => request(app).get(`/api/v1/courses?search=${encodeURIComponent(QUERY)}`);

const accepted = { accepted: true, projectId: 'building-safety', agentType: 'youtube-course-discovery' };

const drafts = () =>
  Course.find({ importQuery: QUERY }).setOptions({ skipPublishedFilter: true }).sort({ createdAt: 1 }).lean();

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  fakeRedis.flushAll();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('YouTube auto-import trigger', () => {
  it('returns 202 with an importing draft when the agent accepts the job', async () => {
    const trigger = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(accepted);

    const res = await search();

    expect(res.status).toBe(202);
    expect(res.body.importing).toBe(true);
    expect(trigger).toHaveBeenCalledWith(
      'youtube-course-discovery',
      expect.objectContaining({ courseQuery: QUERY }),
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
});
