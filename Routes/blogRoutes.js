const express = require('express');
const { Protect, restrictTo } = require('../Controllers/authController');
const {
  getAllBlog,
  createBlog,
  getBlog,
  updateBlog,
  deleteBlog,
  setCoverImage,
  resizePhoto,
  uploadResources,
} = require('../Controllers/blogController');
const blogCommentRouter = require('./blogCommentRoutes');

const router = express.Router();
router.use('/:blogId/comments', blogCommentRouter);
router
  .route('/')
  .get(getAllBlog)
  .post(Protect, restrictTo('instructor', 'admin'), createBlog);

router.use(Protect);
router
  .route('/:id/resources')
  .patch(
    restrictTo('admin', 'instructor'),
    setCoverImage,
    resizePhoto,
    uploadResources,
  );
router
  .route('/:id')
  .get(getBlog)
  .patch(restrictTo('instructor', 'admin'), updateBlog)
  .delete(restrictTo('instructor', 'admin'), deleteBlog);

module.exports = router;
