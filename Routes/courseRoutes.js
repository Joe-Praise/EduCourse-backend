const express = require('express');
const {
  getAllCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  setCoverImage,
  uploadResources,
  resizePhoto,
} = require('../Controllers/courseController');
const { Protect, restrictTo } = require('../Controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:courseId/reviews', reviewRouter);
router
  .route('/')
  .get(getAllCourses)
  .post(Protect, restrictTo('admin', 'instructor'), createCourse);

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
  .get(getCourse)
  .patch(restrictTo('admin', 'instructor'), updateCourse)
  .delete(restrictTo('admin', 'instructor'), deleteCourse);

module.exports = router;
