import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import  AppError from '../utils/appError';
import { getOne, updateOne, deleteOne } from './handlerFactory';

// Import CommonJS modules
const Module = require('../models/courseModuleModel');
// const CompletedCourse = require('../models/completedcourseModel');

export const createModule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // query for all modules linked to the passed course
  const modules = await Module.find({
    courseId: req.body.courseId,
  });

  const findMatch = modules.find((item: any) => item.title === req.body.title);

  if (findMatch) {
    return next(new AppError('Module with that title already exists!', 404));
  }

  //   create index for ordering of modules
  const index = modules.length + 1;
  req.body.moduleIndex = index;
  req.body.section = `Section ${index}`;

  // console.log(req.body);
  // create the module if all cases are passed
  const module = await Module.create({
    courseId: req.body.courseId,
    title: req.body.title,
    moduleIndex: req.body.moduleIndex,
    section: req.body.section,
  });

  res.status(201).json({
    status: 'success',
    data: module,
  });
});

export const getAllModules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let modules: any[] = [];
  const { courseId } = req.query;

  if (courseId) {
    modules = await Module.find({ courseId });
  } else {
    modules = await Module.find();
  }

  res.status(200).json({
    status: 'success',
    results: modules.length,
    data: modules,
  });
});

// exports.getLectureModules = catchAsync(async (req, res, next) => {
//   // let modules = [];
//   const { courseId } = req.query;

//   console.log(req.user._id);
//   const isActivated = await CompletedCourse.find({
//     courseId,
//     userId: req.user._id,
//   });

//   console.log(isActivated);
//   // if (isActivated) {
//   //   modules = await Module.find({ courseId });
//   // } else {
//   //   return next(new AppError('Module with that title already exists!', 404));
//   // }

//   // res.status(201).json({
//   //   status: 'success',
//   //   results: modules.length,
//   //   data: modules,
//   // });
// });

export const getModule = getOne(Module);

export const updateModule = updateOne(Module);

export const deleteModule = deleteOne(Module);
