import express from 'express';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import { createStrictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import {
  getAllLessons,
  createLesson,
  getLesson,
  updateLesson,
  deleteLesson,
} from '../Controllers/lessonController.js';

const router = express.Router();
// Descriptions arrive as builder HTML and are stored as plain text; titles keep their characters.
router.use(createStrictXssSanitizer({ richText: ['description'], plainText: ['title'] }));

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
