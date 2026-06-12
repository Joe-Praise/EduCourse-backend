import express from 'express';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import { sanitizeRichText } from '../middlewares/richTextSanitizer.js';
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
  .post(protect, requirePermission('reviews', 'create'), setBlogId, sanitizeRichText(['review']), createBlogComment);

router.use(protect);
router
  .route('/:id')
  .get(getBlogComment)
  .patch(requirePermission('reviews', 'update'), sanitizeRichText(['review']), updateBlogComment)
  .delete(requirePermission('reviews', 'delete'), deleteBlogComment);

export default router;
