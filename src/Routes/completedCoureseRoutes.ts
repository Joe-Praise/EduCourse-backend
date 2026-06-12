import express from 'express';
import {
  getAllCompletedCourse,
  createCompletedCourse,
  getOneCompletedCourse,
  deleteCompletedCourse,
  getAllActiveCourse,
  updateActiveCourseLessons,
  getProgressSummary,
} from '../Controllers/completedCourseController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getAllCompletedCourse).post(createCompletedCourse);
router
  .route('/:id')
  .get(getOneCompletedCourse)
  .patch(updateActiveCourseLessons)
  .delete(deleteCompletedCourse);
router.route('/active/course').get(getAllActiveCourse);
router.route('/progress/:userId/:courseId').get(getProgressSummary);

export default router;
