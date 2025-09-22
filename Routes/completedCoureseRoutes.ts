import express from 'express';
import {
  getAllCompletedCourse,
  createCompletedCourse,
  getOneCompletedCourse,
  deleteCompletedCourse,
  getAllActiveCourse,
  updateActiveCourseLessons,
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

export default router;
