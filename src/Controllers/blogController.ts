import type { Request, Response, NextFunction } from 'express';
import type { Document } from 'mongoose';
import sharp from 'sharp';
import  catchAsync  from '../utils/catchAsync.js';
import  AppError  from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { formatDate } from '../utils/timeConverter.js';
import { getOne, updateOne, createOne, deleteOne } from './handlerFactory.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';

import { Blog } from '../models/blogModel.js';
import handleImageUpload from '../utils/handleImageUpload.js';

// Import cache events to register listeners
import '../events/cache/blogCache.events.js';

/**
 * Blog Controller
 * Handles CRUD operations for blog posts with image upload and search functionality
 */

// Type definitions
interface BlogRequest extends Request {
  params: {
    id?: string;
  };
  query: {
    slug?: string;
    query?: string;
    page?: string;
    limit?: string;
    sort?: string;
    fields?: string;
    [key: string]: any;
  };
  user?: {
    id: string;
    [key: string]: any;
  };
  file?: any; // Multer file type
}

interface BlogDocument extends Document {
  _doc?: any;
  createdAt: Date;
  title: string;
  slug: string;
  active?: boolean;
}

// Constants
const BLOG_AUTOCOMPLETE_INDEX_NAME = 'blogAutocomplete';
const BLOG_IMAGE_DIMENSIONS = { width: 700, height: 700 };
const AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
const AUTOCOMPLETE_LIMIT = 10;

/**
 * CRUD operations using factory functions
 */
export const createBlog = createOne(Blog, { 
  field: 'title', 
  cachePattern: CacheEvent.BLOG.CREATED 
});
export const getBlog = getOne(Blog, { path: 'comments' });
export const updateBlog = updateOne(Blog, { 
  cachePattern: CacheEvent.BLOG.UPDATED 
});
export const deleteBlog = deleteOne(Blog, { 
  cachePattern: CacheEvent.BLOG.DELETED 
});

/**
 * Configure multer for single image upload
 */
export const setCoverImage = handleImageUpload.single('imageCover');

/**
 * Atlas search autocomplete for blog titles
 * Provides real-time search suggestions with fuzzy matching
 */
export const atlasAutocomplete = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { query } = req.query;

    // Validate query length for performance
    if (!query || (query as string).length < AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'Query too short for autocomplete'
      });
    }

    const pipeline = [
      {
        $search: {
          index: BLOG_AUTOCOMPLETE_INDEX_NAME,
          autocomplete: {
            query,
            path: 'title',
            tokenOrder: 'sequential',
            fuzzy: {
              maxEdits: 1,
              prefixLength: 2
            },
          },
        },
      },
      {
        $project: {
          score: { $meta: 'searchScore' },
          title: 1,
          slug: 1,
          _id: 1,
        },
      },
      {
        $limit: AUTOCOMPLETE_LIMIT
      }
    ];

    try {
      const result = await Blog.aggregate(pipeline);

      res.status(200).json({
        status: 'success',
        data: result,
        count: result.length
      });
    } catch (error) {
      return next(new AppError('Autocomplete search failed', 500));
    }
  }
);

/**
 * Get all blogs with advanced filtering, pagination, and date formatting
 * Supports both slug-based individual queries and list queries
 */
export const getAllBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const { slug } = req.query;

    // Generate cache key for the request
    const cacheKey = CacheKeyBuilder.listKey("blog", req.query);
    
    // Try to get cached data first
    const cachedResult = await cacheManager.get(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json({
        status: 'success',
        metaData: cachedResult.metaData,
        data: cachedResult.data,
      });
    }

    // Handle single blog by slug
    if (slug) {
      const doc = await Blog.find({ slug }).lean();

      if (!doc.length) {
        return next(new AppError('No blog found with that slug', 404));
      }

      // Format the single blog document
      const formattedBlog = {
        ...doc[0],
        createdAt: formatDate(doc[0].createdAt, { format: 'medium' }),
        active: undefined // Remove internal field
      };

      const responseData = {
        metaData: undefined,
        data: [formattedBlog],
      };

      // Cache the single blog result
      await cacheManager.set(cacheKey, responseData);

      res.status(200).json({
        status: 'success',
        data: responseData.data,
      });
      return;
    }

    // Handle multiple blogs with filtering and pagination
    const referencedProperties = ['category', 'tag'];
    const features = new APIFeatures(Blog.find(), req.query)
      .filter(referencedProperties)
      .sorting()
      .limitFields();

    const documents = await features.query;

    // Apply pagination
    const pagination = new Pagination(req.query as any);
    const paginatedResult = pagination.paginate(documents);

    // Format dates and remove internal fields
    const formattedBlogs = paginatedResult.data.map((blog: BlogDocument) => ({
      ...blog._doc,
      createdAt: formatDate(blog.createdAt, { format: 'medium' }),
      active: undefined // Remove internal field
    }));

    // Prepare the complete response structure for caching
    const responseData = {
      metaData: paginatedResult.metaData,
      data: formattedBlogs,
    };

    // Cache the complete response structure
    await cacheManager.set(cacheKey, responseData);

    res.status(200).json({
      status: 'success',
      ...responseData,
    });
  }
);

/**
 * Resize and optimize blog cover images
 * Uses sharp for efficient image processing
 */
export const resizePhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) return next();

    // Generate unique filename
    const timestamp = Date.now();
    const userId = (req as any).user?.id || 'anonymous';
    req.file.filename = `blog-${userId}-${timestamp}.jpeg`;

    try {
      await sharp(req.file.buffer)
        .resize(BLOG_IMAGE_DIMENSIONS.width, BLOG_IMAGE_DIMENSIONS.height, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat('jpeg')
        .jpeg({ 
          quality: 90,
          progressive: true
        })
        .toFile(`public/blog/${req.file.filename}`);

      next();
    } catch (error) {
      return next(new AppError('Image processing failed', 500));
    }
  }
);

/**
 * Upload and associate blog resources/images
 * Updates blog document with new image filename
 */
export const uploadResources = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file?.filename) {
      return next(new AppError('This route is for resource uploads only', 400));
    }

    // Add image filename to request body
    req.body.imageCover = req.file.filename;

    try {
      const updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedBlog) {
        return next(new AppError('No blog found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          blog: updatedBlog,
        },
      });
    } catch (error) {
      return next(new AppError('Failed to update blog with new image', 500));
    }
  }
);
