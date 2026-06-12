import type { Request, Response, NextFunction } from 'express';
import catchAsync  from '../utils/catchAsync.js';
import { formatDate } from '../utils/timeConverter.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { deleteOne, getOne } from './handlerFactory.js';
import { safeTriggerAgent } from '../services/agentService.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { appEvents } from '../events/index.js';

// Import CommonJS modules
import { Review } from "../models/reviewModel.js";

// Import cache events to register listeners
import '../events/cache/reviewCache.events.js';

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
  };
}

export const setCourseUserIds = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.body.userId) req.body.userId = req.user!._id;
  if (!req.body.courseId) req.body.courseId = req.params.courseId;
  next();
});

export const createReview = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const review = await Review.create(req.body);

    appEvents.emit(CacheEvent.REVIEW.CREATED, review);

    // Non-blocking sentiment analysis
    safeTriggerAgent('review-sentiment-analyzer', {
      reviewId:    review._id.toString(),
      courseId:    (review as any).courseId?.toString(),
      text:        (review as any).text ?? '',
      rating:      (review as any).rating ?? 0,
      initiatedBy: `user:${(review as any).userId}`,
    });

    res.status(201).json({ status: 'success', data: review });
  },
);

export const getAllReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let filter: any = {};
  if (req.params.courseId) filter = { courseId: req.params.courseId };

  // Generate cache key for the request
  const cacheKey = CacheKeyBuilder.listKey("review", { ...req.query, ...filter });
  
  // Try to get cached data first
  const cachedResult = await cacheManager.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      status: 'success',
      metaData: cachedResult.metaData,
      data: cachedResult.data,
    });
  }

  const referencedProperties = ['userId', 'courseId'];
  const features = new APIFeatures(Review.find(filter), req.query)
    .filter(referencedProperties)
    .sorting()
    .limitFields();

  const query = await features.query;

  const paginate = new Pagination(req.query).paginate(query);

  let doc = paginate.data;

  doc = doc.map((el: any) => ({
    ...el._doc,
    createdAt: formatDate(el.createdAt),
  }));

  // Prepare the complete response structure for caching
  const responseData = {
    metaData: paginate.metaData,
    data: doc,
  };

  // Cache the complete response structure
  await cacheManager.set(cacheKey, responseData);

  res.status(200).json({
    status: 'success',
    ...responseData,
  });
});

export const updateReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { courseId } = req.body;
  const review = await Review.findById({ _id: id });
  const doc = (review as any)._doc;

  review?.overwrite({ ...doc, courseId });
  await review?.save({ validateBeforeSave: false });

  // Emit cache event for review update
  appEvents.emit(CacheEvent.REVIEW.UPDATED, review);

  res.status(200).json({
    status: 'success',
    data: doc,
  });
});

export const getReview = getOne(Review);

export const deleteReview = deleteOne(Review, { 
  cachePattern: CacheEvent.REVIEW.DELETED 
});
