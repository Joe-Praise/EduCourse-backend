const Lesson = require('../models/lessonModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getOne, updateOne, deleteOne } = require('./handlerFactory');

/**
 *
 * @param {Youtube url} url passed to the request body
 * @returns Youtube VideoId to be saved in the backend
 */
const getVideoId = (url) => {
  const urlCopy = url.split('');

  const isFound = {};
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

exports.createLesson = catchAsync(async (req, res, next) => {
  // get all lessons for this module
  const exists = await Lesson.find({
    moduleId: req.body.moduleId,
  });

  // check if title exists in the arr
  const checkForExistingTitle = exists.find(
    (el) => el.title === req.body.title,
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

exports.getAllLessons = catchAsync(async (req, res, next) => {
  let lessons = [];
  const { moduleId, courseId } = req.query;
  if (courseId) {
    lessons = await Lesson.find({ courseId });
  } else if (moduleId) {
    lessons = await Lesson.find({ moduleId });
  } else {
    lessons = await Lesson.find();
  }

  lessons.forEach((el) => {
    el.active = undefined;
  });

  res.status(201).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

exports.getLesson = getOne(Lesson);

exports.updateLesson = updateOne(Lesson);

exports.deleteLesson = deleteOne(Lesson);
