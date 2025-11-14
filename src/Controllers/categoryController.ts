import type { Request, Response, NextFunction } from 'express';
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

// Import CommonJS modules
import { Category } from "../models/categoryModel.js";

// Import cache events to register listeners
import '../events/cache/categoryCache.events.js';

// Interface for requests with registered courses
interface CategoryRequest extends Request {
  registeredCourses?: Array<{
    courseId: {
      category: {
        _id: string;
      };
    };
  }>;
}

export const getAllCategory = getAll(Category);

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

  const getCategoryId = registeredCourses.map(
    (course) => course.courseId.category._id,
  );

  const category = await Category.find({ _id: { $in: getCategoryId } });

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
