import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} from './handlerFactory';

// Import CommonJS modules
const Category = require('../models/categoryModel');

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
  // used middleware in completedCourse controller to get this data
  const { registeredCourses } = req;

  if (!registeredCourses) {
    return res.status(200).json({
      status: 'success',
      data: [],
    });
  }

  const getCategoryId = registeredCourses.map(
    (course) => course.courseId.category._id,
  );

  const category = await Category.find({ _id: { $in: getCategoryId } });

  res.status(200).json({
    status: 'success',
    data: category,
  });
});

export const getCategory = getOne(Category);

export const createCategory = createOne(Category);

export const updateCategory = updateOne(Category);

export const deleteCategory = deleteOne(Category);
