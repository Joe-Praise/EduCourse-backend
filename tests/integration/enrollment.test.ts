import '../helpers/mocks.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import app from '../../src/app.js';
import { Enrollment } from '../../src/models/enrollmentModel.js';
import { CompletedCourse } from '../../src/models/completedcourseModel.js';
import { InstructorEarning } from '../../src/models/instructorEarningModel.js';
import { Notification } from '../../src/models/notificationModel.js';
import { Course } from '../../src/models/courseModel.js';
import { Instructor } from '../../src/models/instructorModel.js';
import { User } from '../../src/models/userModel.js';
import { fakeRedis } from '../helpers/fakeRedis.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

const PRICE = 100;
const DISCOUNTED = 80;

let studentId: Types.ObjectId;
let otherUserId: Types.ObjectId;
let instructorId: Types.ObjectId;
let courseId: Types.ObjectId;

/** Raw inserts skip unrelated schema requirements; only the fields under test matter. */
async function seed(): Promise<void> {
  studentId = new Types.ObjectId();
  otherUserId = new Types.ObjectId();
  instructorId = new Types.ObjectId();
  courseId = new Types.ObjectId();

  await User.collection.insertMany([
    { _id: studentId, name: 'Student', email: 'student@example.com', role: ['user'], active: true },
    { _id: otherUserId, name: 'Other', email: 'other@example.com', role: ['user'], active: true },
  ]);
  await Instructor.collection.insertOne({ _id: instructorId, name: 'Teacher', active: true });
  await Course.collection.insertOne({
    _id: courseId,
    title: 'Scaffold Safety 101',
    price: PRICE,
    priceDiscount: DISCOUNTED,
    instructors: [instructorId],
    publishedStatus: 'published',
    studentsQuantity: 0,
    active: true,
  });
}

const counts = async () => ({
  enrollments: await Enrollment.countDocuments(),
  progress: await CompletedCourse.countDocuments(),
  earnings: await InstructorEarning.countDocuments(),
  notifications: await Notification.countDocuments(),
});

const bearer = (id: Types.ObjectId) =>
  `Bearer ${jwt.sign({ id: id.toString() }, process.env.JWT_SECRET!, { expiresIn: '5m' })}`;

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  fakeRedis.flushAll();
  await seed();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Enrollment.enrollUser', () => {
  it('creates the enrollment, progress record, earning and notification together', async () => {
    const result = await Enrollment.enrollUser({ userId: studentId, courseId });

    expect(result.enrollment.courseId.toString()).toBe(courseId.toString());
    expect(result.completedCourse).not.toBeNull();
    expect(result.notification.type).toBe('enrollment');
    expect(await counts()).toEqual({ enrollments: 1, progress: 1, earnings: 1, notifications: 1 });
  });

  it('pays the lead instructor 70% of the price the student actually paid', async () => {
    const { earning } = await Enrollment.enrollUser({ userId: studentId, courseId });

    expect(earning).not.toBeNull();
    expect(earning!.instructorId.toString()).toBe(instructorId.toString());
    expect(earning!.amount).toBe(DISCOUNTED);
    expect(earning!.platformFee).toBe(24);
    expect(earning!.netEarning).toBe(56);
  });

  it('records no earning for a free course', async () => {
    await Course.collection.updateOne({ _id: courseId }, { $set: { price: 0, priceDiscount: 0 } });

    const { earning } = await Enrollment.enrollUser({ userId: studentId, courseId });

    expect(earning).toBeNull();
    expect(await InstructorEarning.countDocuments()).toBe(0);
  });

  it('updates the denormalised student count inside the transaction', async () => {
    await Enrollment.enrollUser({ userId: studentId, courseId });

    const course = await Course.collection.findOne({ _id: courseId });
    expect(course!.studentsQuantity).toBe(1);
  });

  it('rejects a duplicate enrollment with 409 and writes nothing', async () => {
    await Enrollment.enrollUser({ userId: studentId, courseId });

    await expect(Enrollment.enrollUser({ userId: studentId, courseId })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(await counts()).toEqual({ enrollments: 1, progress: 1, earnings: 1, notifications: 1 });
  });

  it('rejects an unknown or unpublished course with 404', async () => {
    await expect(
      Enrollment.enrollUser({ userId: studentId, courseId: new Types.ObjectId() }),
    ).rejects.toMatchObject({ statusCode: 404 });

    await Course.collection.updateOne({ _id: courseId }, { $set: { publishedStatus: 'draft' } });
    await expect(Enrollment.enrollUser({ userId: studentId, courseId })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(await counts()).toEqual({ enrollments: 0, progress: 0, earnings: 0, notifications: 0 });
  });

  it('rolls back every write when a later step fails', async () => {
    vi.spyOn(Notification, 'create').mockRejectedValueOnce(new Error('notification store down'));

    await expect(Enrollment.enrollUser({ userId: studentId, courseId })).rejects.toThrow(
      'notification store down',
    );

    // Enrollment, progress and earning were written before the failure,
    // and none of them survived.
    expect(await counts()).toEqual({ enrollments: 0, progress: 0, earnings: 0, notifications: 0 });
    const course = await Course.collection.findOne({ _id: courseId });
    expect(course!.studentsQuantity).toBe(0);
  });
});

describe('POST /api/v1/enrollments', () => {
  it('enrolls the logged-in user', async () => {
    const res = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', bearer(studentId))
      .send({ courseId: courseId.toString() })
      .expect(201);

    expect(res.body.data.userId).toBe(studentId.toString());
  });

  it('forbids enrolling a different user', async () => {
    await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', bearer(studentId))
      .send({ userId: otherUserId.toString(), courseId: courseId.toString() })
      .expect(403);

    expect(await Enrollment.countDocuments()).toBe(0);
  });

  it('requires authentication', async () => {
    await request(app)
      .post('/api/v1/enrollments')
      .send({ courseId: courseId.toString() })
      .expect(401);
  });
});
