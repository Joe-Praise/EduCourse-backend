import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { sanitizeRichText } from '../middlewares/richTextSanitizer.js';
import { getAllBlog, createBlog, getBlog, updateBlog, deleteBlog, setCoverImage, resizePhoto, uploadResources, atlasAutocomplete, } from '../Controllers/blogController.js';
import blogCommentRouter from './blogCommentRoutes.js';
const router = express.Router();
router.use('/:blogId/comments', blogCommentRouter);
router.route('/autocomplete').get(atlasAutocomplete);
router
    .route('/')
    .get(getAllBlog)
    .post(protect, restrictTo(['instructor', 'admin']), sanitizeRichText(['description']), createBlog);
router.use(protect);
router
    .route('/:id/resources')
    .patch(restrictTo(['admin', 'instructor']), setCoverImage, resizePhoto, uploadResources);
router
    .route('/:id')
    .get(getBlog)
    .patch(restrictTo(['instructor', 'admin']), sanitizeRichText(['description']), updateBlog)
    .delete(restrictTo(['instructor', 'admin']), deleteBlog);
export default router;
//# sourceMappingURL=blogRoutes.js.map