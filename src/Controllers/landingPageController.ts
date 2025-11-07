/**
 * Landing Page Controller with Redis Caching
 * 
 * This controller implements Redis caching for landing page data to improve performance.
 * Cache expiry is set to 5 minutes.
 * 
 */

import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import { formatDate } from '../utils/timeConverter.js';
import Pagination from '../utils/paginationFeatures.js';

// Import CommonJS modules
import { Category } from "../models/categoryModel.js";
import { Course } from "../models/courseModel.js";
import { Instructor } from "../models/instructorModel.js";
import { Blog } from "../models/blogModel.js";
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';

const FetchLandingPageData = async (query: any, limit: number): Promise<any[]> => {
  const queryString = { limit, page: 1 };
  const documents = await query.find().limit(limit).sort('-createdAt');

  const paginate = new Pagination(queryString).paginate(documents);

  let doc = paginate.data;

  doc = doc.map((el: any) => ({
    ...el._doc,
    createdAt: formatDate(el.createdAt),
  }));

  return doc;
};


export const landingPage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  
  const cacheKey = CacheKeyBuilder.listKey('landing-page-data');
  // Try to get data from Redis cache
  const cachedData = await cacheManager.get(cacheKey);
  
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      data: cachedData,
    });
  }

  // If no cache, fetch from database
  const limit = 6;
  const instructorLimit = 4;

  const courses = await FetchLandingPageData(Course, limit);
  const blogs = await FetchLandingPageData(Blog, limit);
  const instructors = await FetchLandingPageData(Instructor, instructorLimit);
  const categories = await Category.find().limit(limit);

  const data = {
    courses,
    blogs,
    instructors,
    categories,
  };

  // Cache the data in Redis
  await cacheManager.set(cacheKey, data);

  res.status(200).json({
    status: 'success',
    data
  });

});
