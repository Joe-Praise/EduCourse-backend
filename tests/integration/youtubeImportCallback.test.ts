import '../helpers/mocks.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app.js';
import * as agentService from '../../src/services/agentService.js';
import { Course } from '../../src/models/courseModel.js';
import { CourseModule } from '../../src/models/courseModuleModel.js';
import { Lesson } from '../../src/models/lessonModel.js';
import { cleanModuleTitle } from '../../src/Controllers/agentCallbackController.js';
import { fakeRedis } from '../helpers/fakeRedis.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

// PUT /api/v1/admin/courses/:id/youtube-import — agent-service delivers this at
// least once (retries, lease reclaim). A re-delivery used to append a second
// copy of the curriculum to the same course.

const QUERY = 'nx monorepo';
let draftId: Types.ObjectId;

const video = (id: string, position: number) => ({
  videoId: id, title: `Video ${id}`, thumbnailUrl: '', position, durationSeconds: 120,
});

const payload = () => ({
  primaryCourseId: draftId.toString(),
  courseQuery: QUERY,
  agent_initiated: true,
  courses: [
    {
      youtubePlaylistId: 'PL-PRIMARY', title: 'Intro to Nx', description: 'Primary course',
      instructor: 'Channel A', channelId: 'CH-A', thumbnailUrl: '', videoCount: 4,
      modules: [
        // Out of order, numbered titles, videos reversed — all normalised on import.
        { title: 'Module 2: Advanced Nx', moduleIndex: 2, videos: [video('c', 4), video('b', 3)] },
        { title: 'Module 1: Getting Started', moduleIndex: 1, videos: [video('a', 2), video('z', 1)] },
      ],
    },
    {
      youtubePlaylistId: 'PL-SECOND', title: 'Nx Deep Dive', description: 'Second course',
      instructor: 'Channel B', channelId: 'CH-B', thumbnailUrl: '', videoCount: 1,
      modules: [{ title: 'Basics', moduleIndex: 1, videos: [video('d', 1)] }],
    },
  ],
});

const deliver = () =>
  request(app)
    .put(`/api/v1/admin/courses/${draftId.toString()}/youtube-import`)
    .set('x-agent-api-key', process.env.AGENT_API_KEY!)
    .send(payload());

const moduleCount = (courseId: Types.ObjectId | string) => CourseModule.countDocuments({ courseId });
const coursesFor = (playlistId: string) =>
  Course.countDocuments({ youtubePlaylistId: playlistId }).setOptions({ skipPublishedFilter: true });

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  fakeRedis.flushAll();
  draftId = new Types.ObjectId();
  await Course.collection.insertOne({
    _id: draftId, title: QUERY, description: 'draft', publishedStatus: 'importing',
    importQuery: QUERY, priceCategory: 'Free', price: 0, instructors: [], active: true,
    createdAt: new Date(),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('YouTube import callback', () => {
  it('builds the curriculum once and treats a re-delivery as a no-op', async () => {
    const chained = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);

    const first = await deliver();
    expect(first.status).toBe(200);
    expect(first.body.imported).toBe(2);

    const second = await deliver();
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    expect(await moduleCount(draftId)).toBe(2);
    expect(await coursesFor('PL-SECOND')).toBe(1);
    expect(await Lesson.countDocuments({ courseId: draftId })).toBe(4);
    // summariser + tagger for 2 courses, from the first delivery only.
    expect(chained).toHaveBeenCalledTimes(4);
  });

  it('builds once when two deliveries arrive concurrently', async () => {
    vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);

    const results = await Promise.all([deliver(), deliver()]);

    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(await moduleCount(draftId)).toBe(2);
    expect(await Lesson.countDocuments({ courseId: draftId })).toBe(4);
    expect(await coursesFor('PL-PRIMARY')).toBe(1);
  });

  it('numbers modules 1..n, strips baked-in numbers, and serves them in order', async () => {
    vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);
    await deliver();

    const res = await request(app).get(`/api/v1/modules?courseId=${draftId.toString()}`);

    expect(res.status).toBe(200);
    const modules = res.body.data as Array<{ title: string; moduleIndex: number; lessons: Array<{ title: string; lessonIndex: number }> }>;
    expect(modules.map((m) => [m.moduleIndex, m.title])).toEqual([
      [1, 'Getting Started'],
      [2, 'Advanced Nx'],
    ]);
    expect(modules[0].lessons.map((l) => l.title)).toEqual(['Video z', 'Video a']);
    expect(modules[0].lessons.map((l) => l.lessonIndex)).toEqual([1, 2]);
  });
});

// A different search can discover a playlist that is already published (e.g.
// "nx monorepo" and "nx workspaces" both find PL-PRIMARY). That used to publish
// a second, identical course.
describe('YouTube import — one course per playlist', () => {
  const OTHER_QUERY = 'nx workspaces';
  let otherDraftId: Types.ObjectId;

  const third = {
    youtubePlaylistId: 'PL-THIRD', title: 'Nx Plugins', description: 'Third course',
    instructor: 'Channel C', channelId: 'CH-C', thumbnailUrl: '', videoCount: 1,
    modules: [{ title: 'Plugins', moduleIndex: 1, videos: [video('e', 1)] }],
  };

  // Same primary playlist as payload(), found by another search, plus a new one.
  const deliverOther = () =>
    request(app)
      .put(`/api/v1/admin/courses/${otherDraftId.toString()}/youtube-import`)
      .set('x-agent-api-key', process.env.AGENT_API_KEY!)
      .send({
        primaryCourseId: otherDraftId.toString(),
        courseQuery: OTHER_QUERY,
        agent_initiated: true,
        courses: [payload().courses[0], third],
      });

  const raw = (id: Types.ObjectId) => Course.collection.findOne({ _id: id });

  beforeEach(async () => {
    otherDraftId = new Types.ObjectId();
    await Course.collection.insertOne({
      _id: otherDraftId, title: OTHER_QUERY, description: 'draft', publishedStatus: 'importing',
      importQuery: OTHER_QUERY, priceCategory: 'Free', price: 0, instructors: [], active: true,
      createdAt: new Date(),
    });
  });

  it('reuses the published course and retires the new draft instead of publishing a copy', async () => {
    const chained = vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);
    expect((await deliver()).status).toBe(200);
    chained.mockClear();

    const res = await deliverOther();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, imported: 1, reused: 1 });
    expect(res.body.courseIds).toContain(draftId.toString());

    expect(await coursesFor('PL-PRIMARY')).toBe(1);
    expect(await moduleCount(draftId)).toBe(2);
    expect((await raw(draftId))?.importAliases).toEqual([OTHER_QUERY]);
    expect(await raw(otherDraftId)).toMatchObject({ active: false, publishedStatus: 'archived' });
    expect(await moduleCount(otherDraftId)).toBe(0);

    // The rest of the payload is still imported, and only it is chained.
    expect(await coursesFor('PL-THIRD')).toBe(1);
    expect(chained).toHaveBeenCalledTimes(2);
  });

  it('treats a re-delivery of that callback as a no-op', async () => {
    vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);
    await deliver();
    await deliverOther();

    const again = await deliverOther();

    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ imported: 0, reused: 2 });
    expect(await coursesFor('PL-PRIMARY')).toBe(1);
    expect(await coursesFor('PL-THIRD')).toBe(1);
    expect((await raw(draftId))?.importAliases).toEqual([OTHER_QUERY]);
  });

  it('never retires a course that already has its curriculum, even when an older copy exists', async () => {
    vi.spyOn(agentService, 'safeTriggerAgent').mockResolvedValue(null);
    await deliver();
    // A duplicate published before this check existed, older than the draft's course.
    const olderId = new Types.ObjectId();
    await Course.collection.insertOne({
      _id: olderId, title: 'Intro to Nx', description: 'older copy', publishedStatus: 'published',
      youtubePlaylistId: 'PL-PRIMARY', importQuery: 'nx', priceCategory: 'Free', price: 0,
      instructors: [], active: true, createdAt: new Date(Date.now() - 86_400_000),
    });
    await CourseModule.collection.insertOne({
      courseId: olderId, title: 'Old', moduleIndex: 1, active: true, createdAt: new Date(),
    });

    const redelivery = await deliver();

    expect(redelivery.status).toBe(200);
    expect(redelivery.body.duplicate).toBe(true);
    expect(await raw(draftId)).toMatchObject({ active: true, publishedStatus: 'published' });
    expect((await raw(olderId))?.importAliases).toBeUndefined();
  });
});

describe('cleanModuleTitle', () => {
  it.each([
    ['Module 1: Introduction to Nx', 'Introduction to Nx'],
    ['module 12 - Testing', 'Testing'],
    ['Part 3. Deploying', 'Deploying'],
    ['Section 2) Setup', 'Setup'],
    ['Week 4 — Review', 'Review'],
    ['Introduction to Nx', 'Introduction to Nx'],
    ['Module 1:', 'Module 1:'],
    ['Modules in Angular', 'Modules in Angular'],
  ])('%s → %s', (input, expected) => {
    expect(cleanModuleTitle(input)).toBe(expected);
  });
});
