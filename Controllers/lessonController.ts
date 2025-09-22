import type { Request, Response, NextFunction } from 'express';
import  catchAsync from '../utils/catchAsync';
import  AppError  from '../utils/appError';
import { getOne, updateOne, deleteOne } from './handlerFactory';

// Import CommonJS modules
const Lesson = require('../models/lessonModel');

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

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

export const getAllLessons = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let lessons: any[] = [];
  const { moduleId, courseId } = req.query;
  
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

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

export const getLesson = getOne(Lesson);

export const updateLesson = updateOne(Lesson);

export const deleteLesson = deleteOne(Lesson);
