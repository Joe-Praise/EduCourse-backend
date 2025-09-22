import type { Request, Response, NextFunction } from 'express';
import catchAsync  from '../utils/catchAsync';
import AppError  from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';
import Pagination from '../utils/paginationFeatures';
import { getOne, deleteOne } from './handlerFactory';

// Import CommonJS modules
const CompletedCourse = require('../models/completedcourseModel');
const filterObj = require('../utils/filterObj');

// Interface for requests with registered courses
interface RegisteredCourseRequest extends Request {
  registeredCourses?: Array<{
    courseId: string;
    userId: string;
    completed: boolean;
    lessonsCompleted: string[];
  }>;
}

// Get courses user is registered to
export const getRegisteredCourse = catchAsync(async (req: RegisteredCourseRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const registeredCourses = await CompletedCourse.find({ userId });

  req.registeredCourses = registeredCourses;
  next();
});

export const createCompletedCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const exists = await CompletedCourse.find({
    userId: req.body.userId,
    courseId: req.body.courseId,
  });

  if (exists.length) {
    return next(new AppError('Document already exists', 400));
  }

  const completedCourse = await CompletedCourse.create({
    userId: req.body.userId,
    courseId: req.body.courseId,
  });

  res.status(201).json({
    status: 'success',
    data: completedCourse,
  });
});

export const getAllCompletedCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // const { userId, courseId } = req.query;
  const { userId } = req.query;

  // req.query.completed = true;

  const features = new APIFeatures(CompletedCourse.find({ userId }), req.query)
    .filter()
    .sorting()
    .limitFields();

  const courses = await features.query;

  const paginate = new Pagination(req.query).paginate(courses);

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: paginate.data,
  });
});

export const getAllActiveCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  (req.query as any).completed = false;

  // console.log(req.query);
  const features = new APIFeatures(CompletedCourse.find(), req.query)
    .filter()
    .sorting()
    .limitFields();

  const courses = await features.query;

  res.status(200).json({
    status: 'success',
    result: courses.length,
    data: courses,
  });
});

export const updateActiveCourseLessons = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const exists = await CompletedCourse.findById(id);
  // console.log(exists);

  if (!exists) {
    return next(new AppError('Document does not exist', 400));
  }

  const filteredBody = filterObj(req.body, 'lessonsCompleted');

  const documentCopy = (exists as any)._doc;
  const data = { ...documentCopy };

  const findLessonArr = data.lessonsCompleted.find((lesson: any) =>
    lesson.toString().includes(filteredBody.lessonsCompleted),
  );

  if (!findLessonArr) {
    data.lessonsCompleted.push(filteredBody.lessonsCompleted);
    exists.overwrite({ ...data });
    await exists.save();
  } else {
    const updatedLessons = data.lessonsCompleted.filter(
      (el: any) => !el.toString().includes(filteredBody.lessonsCompleted),
    );

    data.lessonsCompleted = updatedLessons;
    exists.overwrite({ ...data });
    await exists.save();
  }

  res.status(200).json({
    status: 'success',
    result: (exists as any).length,
    data: exists,
  });
});

export const getOneCompletedCourse = getOne(CompletedCourse);

export const deleteCompletedCourse = deleteOne(CompletedCourse);

// catchAsync(async (req, res, next) => {
//     const { id } = req.params;

//     const course = await CompletedCourse.findOne({ _id: id });

//     const data = course._doc;
//     course.overwrite({ ...data, ...req.body });
//     course.save();

//     res.status(200).json({
//       status: 'success',
//       data: course,
//     });
//   });
