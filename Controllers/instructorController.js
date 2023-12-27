// const User = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filterObj = require('../utils/filterObj');
const { getAll, updateOne, deleteOne, getOne } = require('./handlerFactory');

exports.createInstructor = catchAsync(async (req, res, next) => {
  const instructorCheck = await Instructor.find({ userId: req.user._id });

  if (instructorCheck.length) {
    return next(new AppError('Document already exists', 404));
  }

  const instructor = await Instructor.create({
    userId: req.body.userId,
    links: req.body.links,
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
