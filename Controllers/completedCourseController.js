const CompletedCourse = require('../models/completedcourseModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getOne, deleteOne } = require('./handlerFactory');

exports.createCompletedCourse = catchAsync(async (req, res, next) => {
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

exports.getAllCompletedCourse = catchAsync(async (req, res, next) => {
  // const { userId, courseId } = req.query;
  req.query.completed = true;

  const features = new APIFeatures(CompletedCourse.find(), req.query)
    .filter()
    .sorting()
    .limitFields();

  const courses = await features.query;

  // const courses = await CompletedCourse.find({
  //   userId,
  //   courseId,
  //   completed: true,
  // });

  res.status(200).json({
    status: 'success',
    result: courses.length,
    data: [...courses],
  });
});

exports.getAllActiveCourse = catchAsync(async (req, res, next) => {
  req.query.completed = false;

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

exports.getOneCompletedCourse = getOne(CompletedCourse);

exports.deleteCompletedCoures = deleteOne(CompletedCourse);

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
