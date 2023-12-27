const express = require('express');
const { Protect, restrictTo } = require('../Controllers/authController');
const {
  getAllLessons,
  createLesson,
  getLesson,
  updateLesson,
  deleteLesson,
} = require('../Controllers/lessonController');

const router = express.Router();

router.use(Protect);

router
  .route('/')
  .get(getAllLessons)
  .post(restrictTo('admin', 'instructor'), createLesson);

router
  .route('/:id')
  .get(getLesson)
  .patch(restrictTo('admin', 'instructor'), updateLesson)
  .delete(restrictTo('admin', 'instructor'), deleteLesson);

module.exports = router;
