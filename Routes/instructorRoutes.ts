import express from 'express';
import {
  createInstructor,
  getAllInstructors,
  getOneInstructor,
  updateInstructor,
  deleteInstructor,
  updateMe,
  deleteMe,
  suspendInstructor,
  getMyLearningInstructors,
} from '../Controllers/instructorController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getRegisteredCourse,
} from '../Controllers/completedCourseController.js';

const router = express.Router();

router
  .route('/')
  .get(getAllInstructors)
  .post(protect, restrictTo(['admin', 'instructor']), createInstructor);

router.patch('/updateMe', protect, restrictTo(['admin', 'instructor']), updateMe);
router.delete(
  '/deleteMe',
  protect,
  restrictTo(['admin', 'instructor']),
  deleteMe,
);
router.delete(
  '/:id/suspendInstructor',
  protect,
  restrictTo(['admin']),
  suspendInstructor,
);

router.get(
  '/myLearningInstructors/:userId',
  protect,
  getRegisteredCourse,
  getMyLearningInstructors,
);
router
  .route('/:id')
  .get(getOneInstructor)
  .patch(protect, restrictTo(['admin', 'instructor']), updateInstructor)
  .delete(protect, restrictTo(['admin', 'instructor']), deleteInstructor);

export default router;
