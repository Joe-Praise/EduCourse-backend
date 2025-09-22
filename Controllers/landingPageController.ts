import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import { formatDate } from '../utils/timeConverter';
import Pagination from '../utils/paginationFeatures';

// Import CommonJS modules
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Instructor = require('../models/instructorModel');
const Blog = require('../models/blogModel');

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
  const limit = 6;
  const instructorLimit = 4;

  const courses = await FetchLandingPageData(Course, limit);
  const blogs = await FetchLandingPageData(Blog, limit);
  const instructors = await FetchLandingPageData(Instructor, instructorLimit);

  const categories = await Category.find().limit(limit);

  res.status(200).json({
    status: 'success',
    data: {
      courses,
      blogs,
      instructors,
      categories,
    },
  });
});
