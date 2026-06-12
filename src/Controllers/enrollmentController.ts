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
import { CompletedCourse } from '../models/completedcourseModel.js';
import { InstructorEarning } from '../models/instructorEarningModel.js';
import { Notification } from '../models/notificationModel.js';
import { Instructor } from '../models/instructorModel.js';

// Register cache event listeners
import '../events/cache/enrollmentCache.events.js';
import '../events/cache/instructorEarningCache.events.js';
import '../events/cache/notificationCache.events.js';

const PLATFORM_FEE_RATE = 0.3; // 30% platform fee

interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: string[] };
}

export const createEnrollment = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { userId, courseId, paymentRef } = req.body;

    if (!userId || !courseId) {
      return next(new AppError('userId and courseId are required', 400));
    }

    // Check for duplicate enrollment
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing) {
      return next(new AppError('User is already enrolled in this course', 409));
    }

    // Create enrollment
    const enrollment = await Enrollment.create({ userId, courseId, paymentRef });

    // Create CompletedCourse record for backward compatibility with My Learning
    const completedExists = await CompletedCourse.findOne({ userId, courseId });
    if (!completedExists) {
      await CompletedCourse.create({ userId, courseId });
      appEvents.emit(CacheEvent.COMPLETED_COURSE.CREATED, { userId, courseId });
    }

    // Find instructor for this course to record earnings
    const instructor = await Instructor.findOne({ courses: courseId }).populate({
      path: 'courses',
      match: { _id: courseId },
    });

    if (instructor) {
      // Get course price for earning calculation
      const courseData = (enrollment as any).courseId;
      const amount: number =
        typeof courseData === 'object' && courseData?.price ? courseData.price : 0;

      if (amount > 0) {
        const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
        const netEarning = Math.round((amount - platformFee) * 100) / 100;

        const earning = await InstructorEarning.create({
          instructorId: instructor._id,
          courseId,
          enrollmentId: enrollment._id,
          amount,
          platformFee,
          netEarning,
        });

        appEvents.emit(CacheEvent.INSTRUCTOR_EARNING.CREATED, earning);
      }
    }

    // Create welcome notification for the enrolled user
    const notification = await Notification.create({
      userId,
      type: 'enrollment',
      title: 'Enrollment Confirmed',
      message: 'You have successfully enrolled in the course.',
      link: `/my-courses/learning`,
    });

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
