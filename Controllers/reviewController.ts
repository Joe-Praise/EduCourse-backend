import type { Request, Response, NextFunction } from 'express';
import catchAsync  from '../utils/catchAsync';
import { formatDate } from '../utils/timeConverter';
import APIFeatures from '../utils/apiFeatures';
import Pagination from '../utils/paginationFeatures';
import { createOne, deleteOne, getOne } from './handlerFactory';

// Import CommonJS modules
const Review = require('../models/reviewModel');

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

export const createReview = createOne(Review);

export const getAllReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let filter: any = {};
  if (req.params.courseId) filter = { courseId: req.params.courseId };

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

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: doc,
  });
});

export const updateReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { courseId } = req.body;
  const review = await Review.findById({ _id: id });
  const doc = (review as any)._doc;

  review.overwrite({ ...doc, courseId });
  await review.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: doc,
  });
});

export const getReview = getOne(Review);

export const deleteReview = deleteOne(Review);
