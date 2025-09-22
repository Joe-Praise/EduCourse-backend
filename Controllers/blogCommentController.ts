import type { Request, Response, NextFunction } from 'express';
import type { Document } from 'mongoose';
import dayjs from 'dayjs';
import APIFeatures from '../utils/apiFeatures';
import catchAsync from '../utils/catchAsync';
import Pagination from '../utils/paginationFeatures';
import { createOne, getOne, updateOne, deleteOne } from './handlerFactory';
import { formatDate } from '../utils/timeConverter';
import { BlogComment } from '../models/blogCommentModel.js';

/**
 * Blog Comment Controller
 * Handles CRUD operations for blog comments with nested routing support
 */

// Type definitions
interface BlogCommentRequest extends Request {
  params: {
    blogId?: string;
    id?: string;
  };
  body: {
    blogId?: string;
    userId?: string;
    [key: string]: any;
  };
  user?: {
    _id: string;
    [key: string]: any;
  };
}

interface CommentDocument extends Document {
  _doc?: any;
  createdAt: Date;
  blogId: string;
  userId: string;
}

/**
 * Middleware to set blog and user IDs for nested routes
 * @param req - Request object
 * @param res - Response object  
 * @param next - Next function
 */
export const setBlogId = (req: BlogCommentRequest, res: Response, next: NextFunction): void => {
  // Allow nested routes
  if (!req.body.blogId) req.body.blogId = req.params.blogId;
  if (!req.body.userId) req.body.userId = req.user?._id;
  next();
};

/**
 * Get all blog comments with filtering and pagination
 * Supports nested routes and date formatting
 */
export const getAllBlogComments = catchAsync(
  async (req: BlogCommentRequest, res: Response): Promise<void> => {
    let filter: Record<string, any> = {};
    if (req.params.blogId) filter = { blogId: req.params.blogId };

    const features = new APIFeatures(BlogComment.find(filter), req.query)
      .filter()
      .sorting()
      .limitFields();

    const query = await features.query;

    const pagination = new Pagination(req.query);
    const paginatedResult = pagination.paginate(query);

    let doc = paginatedResult.data;

    // Format creation dates to match dayjs format 'MMMM D, YYYY'
    doc = doc.map((el: CommentDocument) => ({
      ...el._doc,
      createdAt: formatDate(el.createdAt, { format: 'medium' }),
    }));    res.status(200).json({
      status: 'success',
      metaData: paginatedResult.metaData,
      data: doc,
    });
  }
);

// CRUD operations using factory functions
export const createBlogComment = createOne(BlogComment);
export const getBlogComment = getOne(BlogComment);
export const updateBlogComment = updateOne(BlogComment);
export const deleteBlogComment = deleteOne(BlogComment);
