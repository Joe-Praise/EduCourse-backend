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
import { Category } from '../models/categoryModel.js';
import { Course } from '../models/courseModel.js';
import { Instructor } from '../models/instructorModel.js';
import { Blog } from '../models/blogModel.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';

const FetchLandingPageData = async (
  query: any,
  limit: number,
): Promise<any[]> => {
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

/**
 * Categories for the landing-page bento.
 *
 * Only categories that at least one PUBLISHED course actually uses are
 * returned, ordered by how many courses they hold. A plain `Category.find()`
 * used to surface the oldest seeded categories — most of them empty — so every
 * bento tile linked to `/courses?category=<id>`, a guaranteed zero-result
 * page. `courseCount` feeds the tile subtitle.
 *
 * The aggregation bypasses the `/^find/` middleware on Course, so the
 * published + active filters are applied explicitly here.
 */
const FetchLandingPageCategories = async (limit: number): Promise<any[]> => {
  const grouped = await Course.aggregate([
    {
      $match: {
        publishedStatus: 'published',
        active: { $ne: false },
        category: { $ne: null },
      },
    },
    { $group: { _id: '$category', courseCount: { $sum: 1 } } },
    { $sort: { courseCount: -1, _id: 1 } },
    { $limit: limit },
  ]);

  if (grouped.length === 0) return [];

  const countById = new Map<string, number>(
    grouped.map((g: any) => [String(g._id), g.courseCount as number]),
  );

  const categories = await Category.find({
    _id: { $in: grouped.map((g: any) => g._id) },
  });

  // Preserve the aggregation order (most courses first) — Category.find()
  // returns them in natural order.
  return categories
    .map((cat: any) => ({
      ...(cat._doc ?? cat),
      courseCount: countById.get(String(cat._id)) ?? 0,
    }))
    .sort((a: any, b: any) => b.courseCount - a.courseCount);
};

export const landingPage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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
    const categoryLimit = 7;

    const courses = await FetchLandingPageData(Course, limit);
    const blogs = await FetchLandingPageData(Blog, limit);
    const instructors = await FetchLandingPageData(Instructor, instructorLimit);
    const categories = await FetchLandingPageCategories(categoryLimit);

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
      data,
    });
  },
);
