import express from 'express';
import { protect, requirePermission, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getAllLessons,
  createLesson,
  getLesson,
  updateLesson,
  deleteLesson,
} from '../Controllers/lessonController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllLessons)
  .post(requirePermission('lessons', 'create'), createLesson);

router
  .route('/:id')
  .get(getLesson)
  .patch(requirePermission('lessons', 'update'), updateLesson)
  .delete(requirePermission('lessons', 'delete'), deleteLesson);

export default router;
