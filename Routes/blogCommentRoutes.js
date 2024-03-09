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
const { atlasAutocomplete } = require('../Controllers/blogController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllBlogComments)
  .post(Protect, restrictTo('user'), setBlogId, createBlogComment);

router.route('/atlas/autocomplete').get(atlasAutocomplete);

router.use(Protect);
router
  .route('/:id')
  .get(getBlogComment)
  .patch(updateBlogComment)
  .delete(deleteBlogComment);

module.exports = router;
