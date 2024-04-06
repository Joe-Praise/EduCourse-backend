const dayjs = require('dayjs');
const Comment = require('../models/blogCommentModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const Pagination = require('../utils/paginationFeatures');
const { createOne, getOne, updateOne, deleteOne } = require('./handlerFactory');

exports.setBlogId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.blogId) req.body.blogId = req.params.blogId;
  if (!req.body.userId) req.body.userId = req.user._id;
  next();
};
exports.getAllBlogComments = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.blogId) filter = { blogId: req.params.blogId };

  const features = new APIFeatures(Comment.find(filter), req.query)
    .filter()
    .sorting()
    .limitFields();

  const query = await features.query;

  const paginate = new Pagination(req.query).pagination(query);

  let doc = paginate.data;

  doc = doc.map((el) => ({
    ...el._doc,
    createdAt: dayjs(el.createdAt).format('MMMM D, YYYY'),
  }));

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: doc,
  });
});

exports.createBlogComment = createOne(Comment);

exports.getBlogComment = getOne(Comment);

exports.updateBlogComment = updateOne(Comment);

exports.deleteBlogComment = deleteOne(Comment);
