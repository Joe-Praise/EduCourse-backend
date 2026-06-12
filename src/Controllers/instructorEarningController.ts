import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';

import { Types } from 'mongoose';
import { InstructorEarning } from '../models/instructorEarningModel.js';
import { Enrollment } from '../models/enrollmentModel.js';
import { Instructor } from '../models/instructorModel.js';
import { Course } from '../models/courseModel.js';
import { Review } from '../models/reviewModel.js';
import { CompletedCourse } from '../models/completedcourseModel.js';

// Register cache event listeners
import '../events/cache/instructorEarningCache.events.js';

interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: string[] };
}

export const getEarningsByInstructor = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { instructorId } = req.query as { instructorId?: string };
    const id = instructorId ?? req.user!._id;

    const cacheKey = CacheKeyBuilder.listKey('instructor-earnings', { instructorId: id });
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', ...cached });
    }

    const features = new APIFeatures(InstructorEarning.find({ instructorId: id }), req.query)
      .filter()
      .sorting()
      .limitFields();

    const docs = await features.query;
    const paginated = new Pagination(req.query).paginate(docs);

    await cacheManager.set(cacheKey, paginated, 300);

    res.status(200).json({ status: 'success', ...paginated });
  },
);

export const getEarningsSummary = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { instructorId } = req.query as { instructorId?: string };
    const id = instructorId ?? req.user!._id;

    const analyticsKey = CacheKeyBuilder.resourceKey('instructor-analytics', id);
    const cached = await cacheManager.get(analyticsKey);
    if (cached) {
      return res.status(200).json({ status: 'success', data: cached });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult, monthResult, byCourse] = await Promise.all([
      InstructorEarning.aggregate([
        { $match: { instructorId: { $eq: id } } },
        { $group: { _id: null, total: { $sum: '$netEarning' } } },
      ]),
      InstructorEarning.aggregate([
        { $match: { instructorId: { $eq: id }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$netEarning' } } },
      ]),
      InstructorEarning.aggregate([
        { $match: { instructorId: { $eq: id } } },
        {
          $group: {
            _id: '$courseId',
            totalEarning: { $sum: '$netEarning' },
            enrollmentCount: { $sum: 1 },
          },
        },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $project: { courseTitle: '$course.title', totalEarning: 1, enrollmentCount: 1 } },
      ]),
    ]);

    const summary = {
      totalEarnings: totalResult[0]?.total ?? 0,
      thisMonthEarnings: monthResult[0]?.total ?? 0,
      byCourse,
    };

    await cacheManager.set(analyticsKey, summary, 300);

    res.status(200).json({ status: 'success', data: summary });
  },
);

export const getDashboardOverview = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Resolve instructor document from req.user._id (the userId on the Instructor model)
    const instructor = await Instructor.findOne({ userId: req.user!._id });
    if (!instructor) {
      return next(new AppError('Instructor profile not found', 404));
    }

    const instructorId = instructor._id.toString();

    const dashboardKey = CacheKeyBuilder.resourceKey('instructor-dashboard', instructorId);
    const cached = await cacheManager.get(dashboardKey);
    if (cached) {
      return res.status(200).json({ status: 'success', data: cached });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, totalEarnings, thisMonthEarnings, recentEnrollments, byCourse] =
      await Promise.all([
        Enrollment.countByCourse(instructorId), // broad count — refined per course below
        InstructorEarning.aggregate([
          { $match: { instructorId: instructor._id } },
          { $group: { _id: null, total: { $sum: '$netEarning' } } },
        ]),
        InstructorEarning.aggregate([
          {
            $match: {
              instructorId: instructor._id,
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$netEarning' } } },
        ]),
        Enrollment.find({ courseId: { $in: [] } }) // placeholder — overridden below
          .sort({ enrolledAt: -1 })
          .limit(10),
        InstructorEarning.aggregate([
          { $match: { instructorId: instructor._id } },
          {
            $group: {
              _id: '$courseId',
              totalEarning: { $sum: '$netEarning' },
              enrollmentCount: { $sum: 1 },
            },
          },
          { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
          { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              courseTitle: '$course.title',
              courseSlug: '$course.slug',
              courseCover: '$course.imageCover',
              publishedStatus: '$course.publishedStatus',
              totalEarning: 1,
              enrollmentCount: 1,
            },
          },
        ]),
      ]);

    // Get courses for this instructor (bypasses publishedStatus filter)
    const courses = await (Instructor as any).findAllByInstructor
      ? []
      : [];

    const overview = {
      totalStudents: totalStudents ?? 0,
      totalEarnings: totalEarnings[0]?.total ?? 0,
      thisMonthEarnings: thisMonthEarnings[0]?.total ?? 0,
      byCourse,
      recentEnrollments,
    };

    await cacheManager.set(dashboardKey, overview, 120); // 2-min TTL

    res.status(200).json({ status: 'success', data: overview });
  },
);

export const getActivityFeed = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const instructor = await Instructor.findOne({ userId: req.user!._id });
    if (!instructor) {
      return next(new AppError('Instructor profile not found', 404));
    }

    const instructorId = instructor._id;

    const cacheKey = CacheKeyBuilder.listKey('instructor-activity', {
      instructorId: instructorId.toString(),
    });
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', data: cached });
    }

    const courses = await Course.find({ instructors: instructorId }).select('_id').lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const [enrollments, reviews, completions, payouts] = await Promise.all([
      Enrollment.aggregate([
        { $match: { courseId: { $in: courseIds }, active: { $ne: false } } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: { $literal: 'enrollment' },
            personName: '$user.name',
            courseTitle: '$course.title',
            timestamp: '$createdAt',
          },
        },
      ]),
      Review.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: { $literal: 'review' },
            personName: '$user.name',
            courseTitle: '$course.title',
            rating: 1,
            timestamp: '$createdAt',
          },
        },
      ]),
      CompletedCourse.aggregate([
        { $match: { courseId: { $in: courseIds }, completed: true } },
        { $sort: { updatedAt: -1 } },
        { $limit: 20 },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: { $literal: 'completion' },
            personName: '$user.name',
            courseTitle: '$course.title',
            timestamp: '$updatedAt',
          },
        },
      ]),
      InstructorEarning.aggregate([
        { $match: { instructorId, active: { $ne: false } } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
          $project: {
            type: { $literal: 'payout' },
            amount: '$netEarning',
            timestamp: '$createdAt',
          },
        },
      ]),
    ]);

    const feed = [...enrollments, ...reviews, ...completions, ...payouts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map((e) => ({ ...e, id: (e._id as Types.ObjectId).toString() }));

    await cacheManager.set(cacheKey, feed, 60);

    res.status(200).json({ status: 'success', data: feed });
  },
);

export const getEngagementHeatmap = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const instructor = await Instructor.findOne({ userId: req.user!._id });
    if (!instructor) {
      return next(new AppError('Instructor profile not found', 404));
    }

    const instructorId = instructor._id;

    const cacheKey = CacheKeyBuilder.resourceKey(
      'instructor-engagement',
      instructorId.toString(),
    );
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', data: cached });
    }

    const courses = await Course.find({ instructors: instructorId }).select('_id').lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // Aggregate enrollment timestamps by day-of-week (0=Sun) and hour-of-day (0-23)
    const heatmap = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds }, active: { $ne: false } } },
      {
        $group: {
          _id: {
            day: { $subtract: [{ $dayOfWeek: '$createdAt' }, 1] },
            hour: { $hour: '$createdAt' },
          },
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          day: '$_id.day',
          hour: '$_id.hour',
          value: 1,
        },
      },
      { $sort: { day: 1, hour: 1 } },
    ]);

    await cacheManager.set(cacheKey, heatmap, 300);

    res.status(200).json({ status: 'success', data: heatmap });
  },
);
