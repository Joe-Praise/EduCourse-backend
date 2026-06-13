import express from 'express';
import { getAllCategory, createCategory, getCategory, updateCategory, deleteCategory, getMyLearningCategory, } from '../Controllers/categoryController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { getRegisteredCourse, } from '../Controllers/completedCourseController.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
const router = express.Router();
router.use(strictXssSanitizer);
router.route('/').get(getAllCategory).post(protect, createCategory);
router.use(protect);
router.get('/registered/:userId', getRegisteredCourse, getMyLearningCategory);
router
    .route('/:id')
    .get(getCategory)
    .patch(updateCategory)
    .delete(restrictTo(['admin']), deleteCategory);
export default router;
//# sourceMappingURL=categoryRoutes.js.map