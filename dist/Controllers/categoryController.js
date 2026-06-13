import catchAsync from '../utils/catchAsync.js';
import { getOne, createOne, updateOne, deleteOne, } from './handlerFactory.js';
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
/**
 * List categories. For COURSE categories (`?group=course`) only those that are
 * actually used by at least one PUBLISHED course are returned — empty
 * categories shouldn't clutter the courses filter / frontend. Blog + ungrouped
 * queries fall through to the standard behaviour. Mirrors the factory `getAll`
 * response shape.
 */
export const getAllCategory = catchAsync(async (req, res, _next) => {
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
});
export const getMyLearningCategory = catchAsync(async (req, res, next) => {
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
        const emptyResult = [];
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
        if (!category)
            return undefined;
        return '_id' in category ? category._id : category;
    })
        .filter((id) => Boolean(id));
    const category = getCategoryId.length === 0
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
//# sourceMappingURL=categoryController.js.map