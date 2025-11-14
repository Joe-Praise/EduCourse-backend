import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import  AppError from '../utils/appError.js';
import { getOne, updateOne, deleteOne } from './handlerFactory.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { appEvents } from '../events/index.js';

// Import CommonJS modules
import { CourseModule } from "../models/courseModuleModel.js";
// import { CompletedCourse } from "../models/completedcourseModel.js";

// Import cache events to register listeners
import '../events/cache/moduleCache.events.js';

export const createModule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // query for all modules linked to the passed course
  const modules = await CourseModule.find({
    courseId: req.body.courseId,
  });

  const findMatch = modules.find((item: any) => item.title === req.body.title);

  if (findMatch) {
    return next(new AppError('CourseModule with that title already exists!', 404));
  }

  //   create index for ordering of modules
  const index = modules.length + 1;
  req.body.moduleIndex = index;
  req.body.section = `Section ${index}`;

  // console.log(req.body);
  // create the CourseModule if all cases are passed
  const newModule = await CourseModule.create({
    courseId: req.body.courseId,
    title: req.body.title,
    moduleIndex: req.body.moduleIndex,
    section: req.body.section,
  });

  // Emit cache event for module creation
  appEvents.emit(CacheEvent.MODULE.CREATED, newModule);

  res.status(201).json({
    status: 'success',
    data: newModule,
  });
});

export const getAllModules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.query;
  
  // Generate cache key for the request
  const cacheKey = CacheKeyBuilder.listKey("module", req.query);
  
  // Try to get cached data first
  const cachedResult = await cacheManager.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      status: 'success',
      results: cachedResult.length,
      data: cachedResult,
    });
  }

  let modules: any[] = [];

  if (courseId) {
    modules = await CourseModule.find({ courseId });
  } else {
    modules = await CourseModule.find();
  }

  // Cache the result
  await cacheManager.set(cacheKey, modules);

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
//   //   modules = await CourseModule.find({ courseId });
//   // } else {
//   //   return next(new AppError('CourseModule with that title already exists!', 404));
//   // }

//   // res.status(201).json({
//   //   status: 'success',
//   //   results: modules.length,
//   //   data: modules,
//   // });
// });

export const getModule = getOne(CourseModule);

export const updateModule = updateOne(CourseModule, { 
  cachePattern: CacheEvent.MODULE.UPDATED 
});

export const deleteModule = deleteOne(CourseModule, { 
  cachePattern: CacheEvent.MODULE.DELETED 
});
