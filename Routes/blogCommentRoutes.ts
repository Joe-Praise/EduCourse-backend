import express from 'express';
import { protect, requirePermission, restrictTo } from '../middlewares/authMiddleware.js';
import {
  createBlogComment,
  getAllBlogComments,
  getBlogComment,
  updateBlogComment,
  deleteBlogComment,
  setBlogId,
} from '../Controllers/blogCommentController.js';

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllBlogComments)
  .post(protect, requirePermission('reviews', 'create'), setBlogId, createBlogComment);

router.use(protect);
router
  .route('/:id')
  .get(getBlogComment)
  .patch(requirePermission('reviews', 'update'), updateBlogComment)
  .delete(requirePermission('reviews', 'delete'), deleteBlogComment);

export default router;
