import express from 'express';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import { sanitizeRichText } from '../middlewares/richTextSanitizer.js';
import { setCourseUserIds, createReview, getAllReview, getReview, updateReview, deleteReview, } from '../Controllers/reviewController.js';
const router = express.Router({ mergeParams: true });
router
    .route('/')
    .get(getAllReview)
    .post(protect, requirePermission('reviews', 'create'), setCourseUserIds, sanitizeRichText(['review']), createReview);
router.use(protect);
router
    .route('/:id')
    .get(getReview)
    .patch(requirePermission('reviews', 'update'), sanitizeRichText(['review']), updateReview)
    .delete(requirePermission('reviews', 'delete'), deleteReview);
export default router;
//# sourceMappingURL=reviewRoutes.js.map