import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import {
  createEnrollment,
  getEnrollmentsByUser,
  getEnrollmentsByCourse,
  checkEnrollment,
  deleteEnrollment,
} from '../Controllers/enrollmentController.js';

const router = express.Router();
router.use(strictXssSanitizer);

router.use(protect);

router.route('/').get(getEnrollmentsByUser).post(createEnrollment);

router.route('/check').get(checkEnrollment);

router.route('/course/:courseId').get(restrictTo(['instructor', 'admin']), getEnrollmentsByCourse);

router.route('/:id').delete(restrictTo(['admin']), deleteEnrollment);

export default router;
