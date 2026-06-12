import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { appEvents } from '../events/index.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';

import { Wishlist } from '../models/wishlistModel.js';
import { Enrollment } from '../models/enrollmentModel.js';

// Register cache event listeners
import '../events/cache/wishlistCache.events.js';

export const addToWishlist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return next(new AppError('userId and courseId are required', 400));
    }

    // Prevent wishlisting a course already enrolled in
    const enrolled = await Enrollment.findOne({ userId, courseId });
    if (enrolled) {
      return next(new AppError('Already enrolled in this course', 409));
    }

    // Prevent duplicates
    const existing = await Wishlist.findOne({ userId, courseId });
    if (existing) {
      return next(new AppError('Course is already in your wishlist', 409));
    }

    const wishlist = await Wishlist.create({ userId, courseId });

    appEvents.emit(CacheEvent.WISHLIST.CREATED, wishlist);

    res.status(201).json({ status: 'success', data: wishlist });
  },
);

export const removeFromWishlist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Wishlist.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );

    if (!doc) {
      return next(new AppError('No wishlist item found with that ID', 404));
    }

    appEvents.emit(CacheEvent.WISHLIST.DELETED, doc._id.toString());

    res.status(204).json({ status: 'success', data: null });
  },
);

export const getWishlistByUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return next(new AppError('userId query parameter is required', 400));
    }

    const cacheKey = CacheKeyBuilder.listKey('wishlist', { userId });
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', ...cached });
    }

    const features = new APIFeatures(Wishlist.find({ userId }), req.query)
      .filter()
      .sorting()
      .limitFields();

    const docs = await features.query;
    const paginated = new Pagination(req.query).paginate(docs);

    await cacheManager.set(cacheKey, paginated);

    res.status(200).json({ status: 'success', ...paginated });
  },
);

export const checkWishlist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, courseId } = req.query as { userId?: string; courseId?: string };

    if (!userId || !courseId) {
      return next(new AppError('userId and courseId query parameters are required', 400));
    }

    const item = await Wishlist.findOne({ userId, courseId });

    res.status(200).json({
      status: 'success',
      data: { wishlisted: !!item, wishlistId: item?._id ?? null },
    });
  },
);
