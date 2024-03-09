const CompletedCourse = require('../models/completedcourseModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filterObj = require('../utils/filterObj');
const Pagination = require('../utils/paginationFeatures');
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
  const { userId } = req.query;

  // req.query.completed = true;

  const features = new APIFeatures(CompletedCourse.find({ userId }), req.query)
    .filter()
    .sorting()
    .limitFields();

  const courses = await features.query;

  const paginate = new Pagination(req.query).pagination(courses);

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: paginate.data,
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

exports.updateActiveCourseLessons = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const exists = await CompletedCourse.findById(id);
  // console.log(exists);

  if (!exists) {
    return next(new AppError('Document does not exist', 400));
  }

  const filteredBody = filterObj(req.body, 'lessonsCompleted');

  const documentCopy = exists._doc;
  const data = { ...documentCopy };

  const findLessonArr = data.lessonsCompleted.find((lesson) =>
    lesson.toString().includes(filteredBody.lessonsCompleted),
  );

  if (!findLessonArr) {
    data.lessonsCompleted.push(filteredBody.lessonsCompleted);
    exists.overwrite({ ...data });
    exists.save();
  } else {
    const updatedLessons = data.lessonsCompleted.filter(
      (el) => !el.toString().includes(filteredBody.lessonsCompleted),
    );

    data.lessonsCompleted = updatedLessons;
    exists.overwrite({ ...data });
    exists.save();
  }

  res.status(200).json({
    status: 'success',
    result: exists.length,
    data: exists,
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
