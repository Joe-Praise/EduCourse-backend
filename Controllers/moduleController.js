const Module = require('../models/courseModuleModel');
const CompletedCourse = require('../models/completedcourseModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getOne, updateOne, deleteOne } = require('./handlerFactory');

exports.createModule = catchAsync(async (req, res, next) => {
  // query for all modules linked to the passed course
  const exists = await Module.find({
    courseId: req.body.courseId,
    title: req.body.title,
  });

  if (exists.length) {
    return next(new AppError('Module with that title already exists!', 404));
  }

  //   create index for ordering of modules
  const index = exists.length + 1;
  req.body.moduleIndex = index;

  //   create the module if all cases are passed
  const module = await Module.create({
    courseId: req.body.courseId,
    title: req.body.title,
    moduleIndex: req.body.moduleIndex,
  });

  res.status(201).json({
    status: 'success',
    data: module,
  });
});

exports.getAllModules = catchAsync(async (req, res, next) => {
  let modules = [];
  const { courseId } = req.query;

  if (courseId) {
    modules = await Module.find({ courseId });
  } else {
    modules = await Module.find();
  }

  res.status(201).json({
    status: 'success',
    results: modules.length,
    data: modules,
  });
});

exports.getLectureModules = catchAsync(async (req, res, next) => {
  // let modules = [];
  const { courseId } = req.query;

  console.log(req.user._id);
  const isActivated = await CompletedCourse.find({
    courseId,
    userId: req.user._id,
  });

  console.log(isActivated);
  // if (isActivated) {
  //   modules = await Module.find({ courseId });
  // } else {
  //   return next(new AppError('Module with that title already exists!', 404));
  // }

  // res.status(201).json({
  //   status: 'success',
  //   results: modules.length,
  //   data: modules,
  // });
});

// exports.getAllLectureModules = catchAsync(async (req, res, next) => {
//   let modules = [];
//   const { courseId } = req.query;

//   if (courseId) {
//     modules = await Module.find({ courseId }).populate({
//       path: 'lessons',
//       // populate: ,
//     });
//   } else {
//     modules = await Module.find();
//   }

//   res.status(201).json({
//     status: 'success',
//     results: modules.length,
//     data: modules,
//   });
// });

exports.getModule = getOne(Module);

exports.updateModule = updateOne(Module);

exports.deleteModule = deleteOne(Module);
