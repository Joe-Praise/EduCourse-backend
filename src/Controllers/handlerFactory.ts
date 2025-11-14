import type { Request, Response, NextFunction } from 'express';
import type { PopulateOptions, Query } from 'mongoose';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import Pagination from '../utils/paginationFeatures.js';
import { appEvents } from '../events/index.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';

/**
 * Grade Handler Factory for CRUD operations
 * Provides type-safe, reusable handlers for Mongoose models
 */

// Flexible model interface that accepts any model with basic Mongoose operations
interface MongooseModel {
  findByIdAndUpdate(id: any, update: any, options?: any): Promise<any>;
  findByIdAndDelete?(id: any): Promise<any>;
  findById(id: any, projection?: any, options?: any): Promise<any>;
  create(doc: any): Promise<any>;
  find(filter?: any): Query<any[], any>;
  findOne(filter?: any): Promise<any>;
  populate?(docs: any, options: any): Promise<any>;
  [key: string]: any;
}

// Type definitions for operations
interface PopOptions {
  field?: string;
  path?: string;
  select?: string;
  model?: string;
  cachePattern?: string;
  modelName?: string;
}

interface QueryRequest extends Request {
  query: {
    slug?: string;
    search?: string;
    page?: string;
    limit?: string;
    sort?: string;
    fields?: string;
    [key: string]: any;
  };
}

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  metaData?: {
    totalPages: number;
    totalDocuments: number;
    page: number;
    count: number;
    limit: number;
  };
  message?: string;
}

/**
 * Soft delete handler
 * Marks document as inactive instead of physical deletion for audit trails
 * @param Model - Mongoose model to operate on
 */
export const deleteOne = (Model: MongooseModel, popOptions?: PopOptions ) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id, 
      { active: false }, 
      { new: true }
    );

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    if(popOptions?.cachePattern){
      appEvents.emit(popOptions.cachePattern, doc._id);
    }

    const response: ApiResponse = {
      status: 'success',
      data: null,
    };

    res.status(204).json(response);
  });

/**
 * Update handler with validation
 * @param Model - Mongoose model to operate on
 */
export const updateOne = (Model: MongooseModel, popOptions?: PopOptions ) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    if(popOptions?.cachePattern){
      appEvents.emit( popOptions?.cachePattern, doc);
    }

    const response: ApiResponse = {
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
export const createOne = (Model: MongooseModel, popOptions?: PopOptions) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // duplicate checking
    if (popOptions?.field) {
      const checkField = popOptions.field;
      const fieldValue = req.body[checkField];

      if (fieldValue) {
        const filter: Record<string, any> = {};
        filter[checkField] = fieldValue;
        const existingDoc = await Model.findOne(filter as any);
        
        if (existingDoc) {
          return next(new AppError(`Document with ${checkField} '${fieldValue}' already exists`, 409));
        }
      }
    }

    const doc = await Model.create(req.body);

    if(popOptions?.cachePattern){
      appEvents.emit( popOptions?.cachePattern, doc);
    }

    const response: ApiResponse = {
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
export const getOne = (Model: MongooseModel, popOptions?: PopOptions) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
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
    let query: any = Model.findById(id);

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

    const response: ApiResponse = {
      status: 'success',
      data: sanitizedDoc,
    };

    res.status(200).json(response);
  });

/**
 * Get all documents handler with advanced filtering and pagination
 * @param Model - Mongoose model to operate on
 */
export const getAll = (Model: MongooseModel) =>
  catchAsync(async (req: QueryRequest, res: Response, next: NextFunction): Promise<Response | void> => {
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
      const docs = await Model.find({ slug } as any);

      const response: ApiResponse = {
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

    const response: ApiResponse = {
      status: 'success',
      ...responseData,
    };

    res.status(200).json(response);
  });

/**
 *  Text search handler with scoring
 * @param Model - Mongoose model to operate on (must have text index)
 */
export const searchModel = (Model: MongooseModel) =>
  catchAsync(async (req: QueryRequest, res: Response, next: NextFunction): Promise<void> => {
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
      const { active, ...sanitized } = doc as any;
      return sanitized;
    });

    const response: ApiResponse = {
      status: 'success',
      data: sanitizedDocs,
    };

    res.status(200).json(response);
  });

/**
 * Bulk operations handler
 * @param Model - Mongoose model to operate on
 */
export const bulkUpdate = (Model: MongooseModel) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { ids, updateData } = req.body;

    if (!ids || !Array.isArray(ids) || !updateData) {
      return next(new AppError('Valid ids array and updateData are required', 400));
    }

    const result = await Model.updateMany(
      { _id: { $in: ids } },
      updateData,
      { runValidators: true }
    );

    const response: ApiResponse = {
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
export const getAnalytics = (Model: MongooseModel) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const response: ApiResponse = {
      status: 'success',
      data: analytics[0] || {
        totalDocuments: 0,
        activeDocuments: 0,
        inactiveDocuments: 0,
      },
    };

    res.status(200).json(response);
  });

// Export types for use in other modules
export type { PopOptions, QueryRequest, ApiResponse };
