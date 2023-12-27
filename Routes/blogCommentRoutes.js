const express = require('express');
const { Protect, restrictTo } = require('../Controllers/authController');
const {
  createBlogComment,
  getAllBlogComments,
  getBlogComment,
  updateBlogComment,
  deleteBlogComment,
  setBlogId,
} = require('../Controllers/blogCommentController');

const router = express.Router({ mergeParams: true });

router.use(Protect);

router
  .route('/')
  .get(getAllBlogComments)
  .post(restrictTo('user'), setBlogId, createBlogComment);

router
  .route('/:id')
  .get(getBlogComment)
  .patch(updateBlogComment)
  .delete(deleteBlogComment);

module.exports = router;
