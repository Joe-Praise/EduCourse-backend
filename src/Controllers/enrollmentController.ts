import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { appEvents } from '../events/index.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';

import { Enrollment } from '../models/enrollmentModel.js';

// Register cache event listeners
import '../events/cache/enrollmentCache.events.js';
import '../events/cache/instructorEarningCache.events.js';
import '../events/cache/notificationCache.events.js';

interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: string[] };
}

export const createEnrollment = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId, paymentRef } = req.body;
    const requesterId = req.user?._id;
    const isAdmin = req.user?.role?.includes('admin') ?? false;

    if (!requesterId) {
      return next(new AppError('You are not logged in', 401));
    }
    if (!courseId) {
      return next(new AppError('courseId is required', 400));
    }

    // Users enroll themselves; only admins may enroll someone else.
    const userId = req.body.userId ?? requesterId;
    if (!isAdmin && String(userId) !== String(requesterId)) {
      return next(new AppError('You can only enroll yourself in a course', 403));
    }

    const { enrollment, completedCourse, earning, notification } =
      await Enrollment.enrollUser({ userId, courseId, paymentRef });

    // Emitted only after the transaction has committed.
    if (completedCourse) {
      appEvents.emit(CacheEvent.COMPLETED_COURSE.CREATED, completedCourse);
    }
    if (earning) {
      appEvents.emit(CacheEvent.INSTRUCTOR_EARNING.CREATED, earning);
    }
    appEvents.emit(CacheEvent.NOTIFICATION.CREATED, notification);
    appEvents.emit(CacheEvent.ENROLLMENT.CREATED, enrollment);

    res.status(201).json({ status: 'success', data: enrollment });
  },
);

export const getEnrollmentsByUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return next(new AppError('userId query parameter is required', 400));
    }

    const cacheKey = CacheKeyBuilder.listKey('enrollments', { userId });
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', ...cached });
    }

    const features = new APIFeatures(Enrollment.find({ userId }), req.query)
      .filter()
      .sorting()
      .limitFields();

    const docs = await features.query;
    const paginated = new Pagination(req.query).paginate(docs);

    await cacheManager.set(cacheKey, paginated);

    res.status(200).json({ status: 'success', ...paginated });
  },
);

export const getEnrollmentsByCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    const features = new APIFeatures(Enrollment.find({ courseId }), req.query)
      .filter()
      .sorting()
      .limitFields();

    const docs = await features.query;
    const paginated = new Pagination(req.query).paginate(docs);

    res.status(200).json({ status: 'success', ...paginated });
  },
);

export const checkEnrollment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, courseId } = req.query as { userId?: string; courseId?: string };

    if (!userId || !courseId) {
      return next(new AppError('userId and courseId query parameters are required', 400));
    }

    const enrollment = await Enrollment.findOne({ userId, courseId });

    res.status(200).json({ status: 'success', data: { enrolled: !!enrollment } });
  },
);

export const deleteEnrollment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );

    if (!doc) {
      return next(new AppError('No enrollment found with that ID', 404));
    }

    appEvents.emit(CacheEvent.ENROLLMENT.DELETED, doc._id.toString());

    res.status(204).json({ status: 'success', data: null });
  },
);
