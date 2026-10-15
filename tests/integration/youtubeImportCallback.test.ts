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
