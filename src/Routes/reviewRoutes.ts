import express from 'express';
import { protect, requirePermission, restrictTo } from '../middlewares/authMiddleware.js';
import {
  setCourseUserIds,
  createReview,
  getAllReview,
  getReview,
  updateReview,
  deleteReview,
} from '../Controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReview)
  .post(protect, requirePermission('reviews', 'create'), setCourseUserIds, createReview);

router.use(protect);
router
  .route('/:id')
  .get(getReview)
  .patch(requirePermission('reviews', 'update'), updateReview)
  .delete(requirePermission('reviews', 'delete'), deleteReview);

export default router;
