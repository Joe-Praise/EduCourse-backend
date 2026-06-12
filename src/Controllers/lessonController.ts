import type { Request, Response, NextFunction } from 'express';
import  catchAsync from '../utils/catchAsync.js';
import  AppError  from '../utils/appError.js';
import { getOne, updateOne, deleteOne } from './handlerFactory.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { appEvents } from '../events/index.js';

// Import CommonJS modules
import { Lesson } from "../models/lessonModel.js";

// Import cache events to register listeners
import '../events/cache/lessonCache.events.js';

/**
 * Extract YouTube video ID from URL
 * @param url - YouTube URL passed to the request body
 * @returns YouTube VideoId to be saved in the backend
 */
const getVideoId = (url: string): string => {
  const urlCopy = url.split('');

  const isFound: Record<string, number> = {};
  const urlIndex = urlCopy.reduce(
    (acc, cur, index, arr) => {
      if (cur === '=' && isFound[cur] !== 1) {
        isFound[cur] = 1;
        acc.start = index + 1;
      }
      if (cur === '&' && isFound[cur] !== 1) {
        isFound[cur] = 1;
        acc.end = index;
      }

      if (!arr.includes('&')) {
        acc.end = arr.length;
      }

      return acc;
    },
    { start: 0, end: 0 },
  );

  const videoId = url.slice(urlIndex.start, urlIndex.end);
  return videoId;
};

export const createLesson = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // get all lessons for this module
  const exists = await Lesson.find({
    moduleId: req.body.moduleId,
  });

  // check if title exists in the arr
  const checkForExistingTitle = exists.find(
    (el: any) => el.title === req.body.title,
  );

  // throw error if it exists
  if (checkForExistingTitle) {
    return next(new AppError('Document already exists', 404));
  }

  // Get the videoId Out
  // https://www.youtube.com/watch?v=UxiLC9XFvuM&t=14s
  req.body.url = getVideoId(req.body.url);

  // create index for ordering of modules
  const index = exists.length + 1;
  req.body.lessonIndex = index;

  const doc = await Lesson.create(req.body);

  // Emit cache event for lesson creation
  appEvents.emit(CacheEvent.LESSON.CREATED, doc);

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

export const getAllLessons = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { moduleId, courseId } = req.query;
  
  // Generate cache key for the request
  const cacheKey = CacheKeyBuilder.listKey("lesson", req.query);
  
  // Try to get cached data first
  const cachedResult = await cacheManager.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      status: 'success',
      results: cachedResult.length,
      data: cachedResult,
    });
  }

  let lessons: any[] = [];
  
  if (courseId) {
    lessons = await Lesson.find({ courseId });
  } else if (moduleId) {
    lessons = await Lesson.find({ moduleId });
  } else {
    lessons = await Lesson.find();
  }

  lessons.forEach((el: any) => {
    el.active = undefined;
  });

  // Cache the result
  await cacheManager.set(cacheKey, lessons);

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

export const getLesson = getOne(Lesson);

export const updateLesson = updateOne(Lesson, { 
  cachePattern: CacheEvent.LESSON.UPDATED 
});

export const deleteLesson = deleteOne(Lesson, { 
  cachePattern: CacheEvent.LESSON.DELETED 
});
