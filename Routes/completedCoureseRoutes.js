const express = require('express');
const {
  getAllCompletedCourse,
  createCompletedCourse,
  getOneCompletedCourse,
  deleteCompletedCoures,
  getAllActiveCourse,
} = require('../Controllers/completedCourseController');
const { Protect } = require('../Controllers/authController');

const router = express.Router();

router.use(Protect);
router.route('/').get(getAllCompletedCourse).post(createCompletedCourse);
router.route('/:id').get(getOneCompletedCourse).delete(deleteCompletedCoures);
router.route('/active/course').get(getAllActiveCourse);

module.exports = router;
