const Comment = require('../models/blogCommentModel');
const catchAsync = require('../utils/catchAsync');
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

  const comment = await Comment.find(filter);

  res.status(200).json({
    status: 'success',
    results: comment.length,
    data: comment,
  });
});

exports.createBlogComment = createOne(Comment);

exports.getBlogComment = getOne(Comment);

exports.updateBlogComment = updateOne(Comment);

exports.deleteBlogComment = deleteOne(Comment);
