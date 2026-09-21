import { Types } from 'mongoose';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import Pagination from '../utils/paginationFeatures.js';
import { appEvents } from '../events/index.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
/**
 * Soft delete handler
 * Marks document as inactive instead of physical deletion for audit trails
 * @param Model - Mongoose model to operate on
 */
export const deleteOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    if (popOptions?.cachePattern) {
        appEvents.emit(popOptions.cachePattern, doc._id);
    }
    const response = {
        status: 'success',
        data: null,
    };
    res.status(204).json(response);
});
/**
 * Update handler with validation
 * @param Model - Mongoose model to operate on
 */
export const updateOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    if (popOptions?.cachePattern) {
        appEvents.emit(popOptions?.cachePattern, doc);
    }
    const response = {
        status: 'success',
        data: doc,
    };
    res.status(200).json(response);
});
/**
 * Create handler with duplicate checking
 * @param Model - Mongoose model to operate on
 * @param popOptions - Options for duplicate checking and population
 */
export const createOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    // duplicate checking
    if (popOptions?.field) {
        const checkField = popOptions.field;
        const fieldValue = req.body[checkField];
        if (fieldValue) {
            const filter = {};
            filter[checkField] = fieldValue;
            const existingDoc = await Model.findOne(filter);
            if (existingDoc) {
                return next(new AppError(`Document with ${checkField} '${fieldValue}' already exists`, 409));
            }
        }
    }
    const doc = await Model.create(req.body);
    if (popOptions?.cachePattern) {
        appEvents.emit(popOptions?.cachePattern, doc);
    }
    const response = {
        status: 'success',
        data: doc,
    };
    res.status(201).json(response);
});
/**
 * Get single document handler with population
 * @param Model - Mongoose model to operate on
 * @param popOptions - Population options for related documents
 */
export const getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    const { id } = req.params;
    // Defense in depth: if a literal-path route (e.g. /me, /preferences) is
    // accidentally registered AFTER `/:id`, the request would fall through
    // here with `id = "me"`. Mongoose would then throw an opaque CastError.
    // Return a clean 404 instead so the client gets actionable feedback and
    // Sentry isn't spammed with cast errors.
    if (!Types.ObjectId.isValid(id)) {
        return next(new AppError('No document found with that ID', 404));
    }
    // Generate cache key - use model name if available, otherwise use 'resource'
    const modelName = popOptions?.modelName || 'resource';
    const cacheKey = CacheKeyBuilder.resourceKey(modelName?.toLowerCase(), id);
    // Try to get cached data
    const cachedResult = await cacheManager.get(cacheKey);
    if (cachedResult) {
        return res.status(200).json({
            status: 'success',
            data: cachedResult,
        });
    }
    // If no cache, fetch from database
    let query = Model.findById(id);
    if (popOptions?.path) {
        query = query.populate(popOptions.path);
    }
    const doc = await query;
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    // Remove internal fields from response
    const sanitizedDoc = { ...doc.toObject() };
    delete sanitizedDoc.active;
    // Cache the result
    await cacheManager.set(cacheKey, sanitizedDoc);
    const response = {
        status: 'success',
        data: sanitizedDoc,
    };
    res.status(200).json(response);
});
/**
 * Get all documents handler with advanced filtering and pagination
 * @param Model - Mongoose model to operate on
 */
export const getAll = (Model) => catchAsync(async (req, res, next) => {
    const { slug } = req.query;
    // Generate cache key - use model name if available
    const modelName = Model.modelName || Model.collection?.name || 'resource';
    const cacheKey = CacheKeyBuilder.listKey(modelName.toLowerCase(), req.query);
    // Try to get cached data
    const cachedResult = await cacheManager.get(cacheKey);
    if (cachedResult) {
        return res.status(200).json({
            status: 'success',
            metaData: cachedResult.metaData,
            data: cachedResult.data,
        });
    }
    // Handle slug-based queries (for SEO-friendly URLs)
    if (slug) {
        const docs = await Model.find({ slug });
        const response = {
            status: 'success',
            data: docs,
        };
        return res.status(200).json(response);
    }
    // filtering with APIFeatures
    const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sorting()
        .limitFields();
    const documents = await features.query;
    // pagination
    const pagination = new Pagination(req.query);
    const paginatedResult = pagination.paginate(documents);
    // Prepare the complete response structure for caching
    const responseData = {
        metaData: paginatedResult.metaData,
        data: paginatedResult.data,
    };
    // Cache the complete response structure
    await cacheManager.set(cacheKey, responseData);
    const response = {
        status: 'success',
        ...responseData,
    };
    res.status(200).json(response);
});
/**
 *  Text search handler with scoring
 * @param Model - Mongoose model to operate on (must have text index)
 */
export const searchModel = (Model) => catchAsync(async (req, res, next) => {
    const { search } = req.query;
    if (!search) {
        return next(new AppError('Search query is required', 400));
    }
    // text search with relevance scoring
    const docs = await Model.find({ $text: { $search: search } })
        .sort({ score: { $meta: 'textScore' } })
        .lean();
    // Sanitize documents (remove internal fields)
    const sanitizedDocs = docs.map(doc => {
        const { active, ...sanitized } = doc;
        return sanitized;
    });
    const response = {
        status: 'success',
        data: sanitizedDocs,
    };
    res.status(200).json(response);
});
/**
 * Bulk operations handler
 * @param Model - Mongoose model to operate on
 */
export const bulkUpdate = (Model) => catchAsync(async (req, res, next) => {
    const { ids, updateData } = req.body;
    if (!ids || !Array.isArray(ids) || !updateData) {
        return next(new AppError('Valid ids array and updateData are required', 400));
    }
    const result = await Model.updateMany({ _id: { $in: ids } }, updateData, { runValidators: true });
    const response = {
        status: 'success',
        data: {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        },
    };
    res.status(200).json(response);
});
/**
 * Analytics handler for document statistics
 * @param Model - Mongoose model to operate on
 */
export const getAnalytics = (Model) => catchAsync(async (req, res, next) => {
    const analytics = await Model.aggregate([
        {
            $group: {
                _id: null,
                totalDocuments: { $sum: 1 },
                activeDocuments: {
                    $sum: { $cond: [{ $ne: ['$active', false] }, 1, 0] }
                },
                inactiveDocuments: {
                    $sum: { $cond: [{ $eq: ['$active', false] }, 1, 0] }
                },
            }
        }
    ]);
    const response = {
        status: 'success',
        data: analytics[0] || {
            totalDocuments: 0,
            activeDocuments: 0,
            inactiveDocuments: 0,
        },
    };
    res.status(200).json(response);
});
//# sourceMappingURL=handlerFactory.js.map