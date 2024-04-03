// const User = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filterObj = require('../utils/filterObj');
const { getAll, updateOne, deleteOne, getOne } = require('./handlerFactory');

exports.createInstructor = catchAsync(async (req, res, next) => {
  const admin = ['admin'];
  const isAdmin = admin.some((el) => req.user.role.indexOf(el) !== -1);

  const { userId, links } = req.body;

  const query = isAdmin === true ? { userId } : { userId: req.user._id };

  // if admin use userId from body else use logged in userId
  const instructorCheck = await Instructor.find(query);

  // checj for existing instructor
  if (instructorCheck.length) {
    return next(new AppError('Document already exists', 404));
  }

  // get user from user collection
  const user = await User.findById({ _id: userId });

  if (!user) {
    next(new AppError('User does not exist!', 404));
  }

  const userCopy = user._doc;
  userCopy.role.push('instructor');

  user.overwrite({ ...userCopy });
  user.save({ validateBeforeSave: false });

  const instructor = await Instructor.create({
    userId,
    links,
  });

  return res.status(201).json({
    status: 'success',
    data: instructor,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'links');
  const instructor = await Instructor.findOne({
    userId: req.user._id,
  });

  if (!instructor) {
    next(new AppError('Instructor does not exist!', 404));
  }

  const data = instructor._doc;

  instructor.overwrite({ ...data, ...filteredBody });
  instructor.save();
  res.status(200).json({
    status: 'success',
    data: {
      instructor: instructor,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const instructor = await Instructor.findOne({
    userId: req.user._id,
  });

  if (!instructor) {
    next(new AppError('Instructor does not exist!', 404));
  }

  await Instructor.findByIdAndUpdate(instructor._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllInstructors = getAll(Instructor);

exports.getMyLearningInstructors = catchAsync(async (req, res, next) => {
  // used middleware in completedCourse controller to ger this data
  const { registeredCourses } = req;

  const getInstructorsId = registeredCourses
    .map((course) => course.courseId.instructors)
    .flatMap((el) => el);

  const cache = {};

  for (let i = 0; i < getInstructorsId.length; i + 1) {
    if (!cache[getInstructorsId[i]._id]) {
      cache[getInstructorsId[i]._id] = true;
    }
  }

  const uniqueInstructors = Object.keys(cache);

  res.status(200).json({
    status: 'success',
    data: uniqueInstructors,
  });
});

exports.getOneInstructor = getOne(Instructor);

exports.updateInstructor = updateOne(Instructor);

exports.deleteinstructor = deleteOne(Instructor);

// id is the particular instructor id not userId
exports.suspendInstructor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const instructor = await Instructor.findById(id);

  if (!instructor) {
    next(new AppError('Instructor does not exist!', 404));
  }

  await Instructor.findByIdAndUpdate(instructor._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
