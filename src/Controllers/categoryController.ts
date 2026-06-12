import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import catchAsync from '../utils/catchAsync.js';
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from './handlerFactory.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';

// Import CommonJS modules
import { Category } from "../models/categoryModel.js";
import { Course } from "../models/courseModel.js";

// Import cache events to register listeners
import '../events/cache/categoryCache.events.js';

// Shape of a registered course after `getRegisteredCourse` has populated
// `courseId`. `category` may be a populated sub-doc ({ _id }) or a raw ObjectId
// ref — and either `courseId` or `category` can be absent (e.g. a course
// imported without a category, or a soft-deleted course whose populate
// resolved to `null`). Everything is therefore optional and guarded below.
interface PopulatedCourseRef {
  category?: { _id?: Types.ObjectId } | Types.ObjectId | null;
}
interface RegisteredCourseRef {
  courseId?: PopulatedCourseRef | null;
}
interface CategoryRequest extends Request {
  registeredCourses?: RegisteredCourseRef[];
}

/**
 * List categories. For COURSE categories (`?group=course`) only those that are
 * actually used by at least one PUBLISHED course are returned — empty
 * categories shouldn't clutter the courses filter / frontend. Blog + ungrouped
 * queries fall through to the standard behaviour. Mirrors the factory `getAll`
 * response shape.
 */
export const getAllCategory = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<Response | void> => {
    let base = Category.find();

    if (req.query.group === 'course') {
      const usedCategoryIds = await Course.distinct('category', {
        publishedStatus: 'published',
      });
      base = Category.find({ _id: { $in: usedCategoryIds } });
    }

    const features = new APIFeatures(base, req.query)
      .filter()
      .sorting()
      .limitFields();

    const documents = await features.query;
    const { metaData, data } = new Pagination(req.query).paginate(documents);

    return res.status(200).json({ status: 'success', metaData, data });
  },
);

export const getMyLearningCategory = catchAsync(async (req: CategoryRequest, res: Response, next: NextFunction) => {
  const { registeredCourses } = req;
  const userId = req.params.userId;

  // Generate cache key for user's learning categories
  const cacheKey = CacheKeyBuilder.resourceKey("user-categories", userId);
  
  // Try to get cached data first
  const cachedResult = await cacheManager.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      status: 'success',
      data: cachedResult,
    });
  }

  // used middleware in completedCourse controller to get this data
  if (!registeredCourses) {
    const emptyResult: any[] = [];
    
    // Cache empty result for short time to avoid repeated DB calls
    await cacheManager.set(cacheKey, emptyResult, 60); // 1 minute TTL for empty results
    
    return res.status(200).json({
      status: 'success',
      data: emptyResult,
    });
  }

  // Collect the category ref of every registered course, tolerating courses
  // that have no category and courses whose `courseId` populate resolved to
  // null. A populated category exposes `_id`; a raw ObjectId ref is used as-is.
  const getCategoryId = registeredCourses
    .map((course) => {
      const category = course?.courseId?.category;
      if (!category) return undefined;
      return '_id' in category ? category._id : category;
    })
    .filter((id): id is Types.ObjectId => Boolean(id));

  const category =
    getCategoryId.length === 0
      ? []
      : await Category.find({ _id: { $in: getCategoryId } });

  // Cache the result
  await cacheManager.set(cacheKey, category, 300); // 5 minutes TTL

  res.status(200).json({
    status: 'success',
    data: category,
  });
});

export const getCategory = getOne(Category);

export const createCategory = createOne(Category, { 
  cachePattern: CacheEvent.CATEGORY.CREATED 
});

export const updateCategory = updateOne(Category, { 
  cachePattern: CacheEvent.CATEGORY.UPDATED 
});

export const deleteCategory = deleteOne(Category, { 
  cachePattern: CacheEvent.CATEGORY.DELETED 
});
