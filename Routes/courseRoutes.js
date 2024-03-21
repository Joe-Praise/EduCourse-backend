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
  // searchCourses,
  getLectureCourse,
  // atlasSearchCourse,
  atlasAutocomplete,
  getMyLearningCourse,
  searchModel,
} = require('../Controllers/courseController');
const { Protect, restrictTo } = require('../Controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:courseId/reviews', reviewRouter);
router
  .route('/')
  .get(getAllCourses)
  .post(Protect, restrictTo('admin', 'instructor'), createCourse);

// router.route('/search').get(atlasSearchCourse);
router.route('/autocomplete').get(atlasAutocomplete);

router.use(Protect);
router.route('/localSearch').get(searchModel);
router.route('/learn/:userId/:courseId').get(getLectureCourse);
router.route('/mylearning/:userId').get(getMyLearningCourse);
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
