const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const Pagination = require('../utils/paginationFeatures');
const { createOne, deleteOne, getOne } = require('./handlerFactory');

exports.setCourseUserIds = catchAsync(async (req, res, next) => {
  if (!req.body.userId) req.body.userId = req.user._id;
  if (!req.body.courseId) req.body.courseId = req.params.courseId;
  next();
});

exports.createReview = createOne(Review);

exports.getAllReview = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.courseId) filter = { courseId: req.params.courseId };

  const referencedProperties = ['userId', 'courseId'];
  const features = new APIFeatures(Review.find(filter), req.query)
    .filter(referencedProperties)
    .sorting()
    .limitFields();

  const query = await features.query;

  const paginate = new Pagination(req.query).pagination(query);

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: paginate.data,
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { courseId } = req.body;
  const review = await Review.findById({ _id: id });
  const doc = review._doc;

  review.overwrite({ ...doc, courseId });
  review.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: doc,
  });
});

exports.getReview = getOne(Review);

exports.deleteReview = deleteOne(Review);
