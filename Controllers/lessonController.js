const Lesson = require('../models/lessonModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getOne, updateOne, deleteOne } = require('./handlerFactory');

exports.createLesson = catchAsync(async (req, res, next) => {
  // checking if the course document already exists
  const exists = await Lesson.find({
    moduleId: req.body.moduleId,
    title: req.body.title,
  });

  if (exists.length) {
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
  const { moduleId } = req.query;

  if (moduleId) {
    lessons = await Lesson.find({ moduleId });
  } else {
    lessons = await Lesson.find();
  }

  res.status(201).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

exports.getLesson = getOne(Lesson);

exports.updateLesson = updateOne(Lesson);

exports.deleteLesson = deleteOne(Lesson);
