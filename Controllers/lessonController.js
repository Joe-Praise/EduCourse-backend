const Lesson = require('../models/lessonModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getOne, updateOne, deleteOne } = require('./handlerFactory');

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

  //   create index for ordering of modules
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
