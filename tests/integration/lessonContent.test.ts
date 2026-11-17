import '../helpers/mocks.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import app from '../../src/app.js';
import { User } from '../../src/models/userModel.js';
import { Course } from '../../src/models/courseModel.js';
import { CourseModule } from '../../src/models/courseModuleModel.js';
import { Lesson } from '../../src/models/lessonModel.js';
import { getModuleLessons } from '../../src/mcp/edcourseContent/tool.js';
import { connectTestDb, disconnectTestDb } from '../helpers/db.js';

const instructorId = new Types.ObjectId();
const studentId = new Types.ObjectId();
const courseId = new Types.ObjectId();
const moduleId = new Types.ObjectId();
const lessonId = new Types.ObjectId();

const TITLE = 'Generics <T> & Map<K, V>';
const URL = 'https://www.youtube.com/watch?v=SqcXvc3ZmRU';
// Shape of LessonBuilder (TipTap) output.
const BUILDER_HTML =
  '<h2>Scaling</h2><p>Systems &amp; scalability: use Vec&lt;T&gt;.</p>' +
  '<ul><li><p>Vertical</p></li><li><p>Horizontal</p></li></ul>';
const BUILDER_TEXT = 'Scaling\n\nSystems & scalability: use Vec<T>.\n\nVertical\nHorizontal';

const bearer = (id: Types.ObjectId) =>
  `Bearer ${jwt.sign({ id: id.toString() }, process.env.JWT_SECRET!, { expiresIn: '5m' })}`;
const patch = (body: object, id: Types.ObjectId = instructorId) =>
  request(app).patch(`/api/v1/lessons/${lessonId}`).set('Authorization', bearer(id)).send(body);
const create = (body: object) =>
  request(app).post('/api/v1/lessons').set('Authorization', bearer(instructorId)).send({
    moduleId: moduleId.toString(),
    courseId: courseId.toString(),
    url: 'https://youtu.be/xpDnVSmNFX0',
    duration: '7:56',
    ...body,
  });
const stored = (id: Types.ObjectId = lessonId) => Lesson.collection.findOne({ _id: id });

beforeAll(async () => {
  await connectTestDb();
  // Raw inserts skip unrelated schema requirements; only the fields under test matter.
  await User.collection.insertMany([
    { _id: instructorId, name: 'Teacher', email: 'teacher@example.com', role: ['instructor'], active: true },
    { _id: studentId, name: 'Student', email: 'student@example.com', role: ['user'], active: true },
  ]);
  await Course.collection.insertOne({ _id: courseId, title: 'System Design', publishedStatus: 'published', active: true });
  await CourseModule.collection.insertOne({
    _id: moduleId, courseId, moduleIndex: 1, title: 'Introduction', section: 'Module 1', active: true,
  });
  await Lesson.collection.insertOne({
    _id: lessonId, moduleId, courseId, title: TITLE, url: URL, duration: '9:22', lessonIndex: 1, active: true,
  });
});

afterAll(disconnectTestDb);

describe('PATCH /api/v1/lessons/:id', () => {
  it('stores builder HTML as readable plain text and leaves the title as typed', async () => {
    // LessonBuilder sends title, url and duration with every save.
    const res = await patch({ title: TITLE, url: URL, duration: '9:22', description: BUILDER_HTML });
    expect(res.status).toBe(200);
    const doc = await stored();
    expect(doc?.description).toBe(BUILDER_TEXT);
    expect(doc?.title).toBe(TITLE);
    expect(doc?.url).toBe(URL);
  });

  it('does not touch the title when only the description changes', async () => {
    expect((await patch({ description: '<p>Only the description</p>' })).status).toBe(200);
    const doc = await stored();
    expect(doc?.title).toBe(TITLE);
    expect(doc?.description).toBe('Only the description');
  });

  it('removes executable markup from descriptions', async () => {
    await patch({ description: '<p onclick="alert(1)">Safe</p><script>alert(1)</script><img src=x onerror=alert(1)>' });
    expect((await stored())?.description).toBe('Safe');
  });

  it('still strips HTML from other fields', async () => {
    await patch({ duration: '<b>9:22</b>' });
    expect((await stored())?.duration).toBe('9:22');
  });

  it('still enforces the 10kb request body limit', async () => {
    const before = (await stored())?.description;
    const res = await patch({ description: 'a'.repeat(11 * 1024) });
    // Rejected by express.json before the route runs. (The global error handler
    // currently answers 500 rather than 413 for this; unchanged here.)
    expect(res.ok).toBe(false);
    expect((await stored())?.description).toBe(before);
  });

  it('keeps authentication and authorization unchanged', async () => {
    expect((await request(app).patch(`/api/v1/lessons/${lessonId}`).send({ description: 'x' })).status).toBe(401);
    expect((await patch({ description: 'x' }, studentId)).status).toBe(403);
  });
});

describe('POST /api/v1/lessons', () => {
  it('stores the same description text as an update, and the title as typed', async () => {
    const title = 'Vec<T> & Map<K, V>: create';
    const res = await create({ title, description: BUILDER_HTML });
    expect(res.status).toBe(201);
    const doc = await stored(new Types.ObjectId(res.body.data._id as string));
    expect(doc?.description).toBe(BUILDER_TEXT);
    expect(doc?.title).toBe(title);
  });

  it('removes executable markup from titles', async () => {
    const res = await create({ title: 'Safe title <img src=x onerror=alert(1)>', description: '' });
    expect(res.status).toBe(201);
    expect((await stored(new Types.ObjectId(res.body.data._id as string)))?.title).toBe('Safe title');
  });
});

describe('MCP mapping', () => {
  it('get_module_lessons returns the stored description as the lesson body', async () => {
    await patch({ description: BUILDER_HTML });
    const res = await getModuleLessons({ courseId: courseId.toString(), moduleIndex: 1 });
    expect(res.isError).toBeUndefined();
    const payload = JSON.parse((res.content[0] as { text: string }).text) as {
      lessons: { title: string; body: string }[];
    };
    expect(payload.lessons.find((l) => l.title === TITLE)?.body).toBe(BUILDER_TEXT);
  });
});
