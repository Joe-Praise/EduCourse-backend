import express from 'express';
import { getAllCourses, createCourse, getCourse, updateCourse, deleteCourse, uploadResources, resizePhoto, 
// searchCourses,
getLectureCourse, 
// atlasSearchCourse,
atlasAutocomplete, getMyLearningCourse, submitForReview, publishCourse, archiveCourse, } from '../Controllers/courseController.js';
import { triggerQuizGeneration, getQuiz } from '../Controllers/aiTriggerController.js';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import { sanitizeRichText } from '../middlewares/richTextSanitizer.js';
import reviewRouter from './reviewRoutes.js';
import upload from '../utils/handleImageUpload.js';
const router = express.Router();
router.use('/:courseId/reviews', reviewRouter);
router
    .route('/')
    .get(getAllCourses)
    .post(protect, requirePermission('courses', 'create'), sanitizeRichText(['description']), createCourse);
// router.route('/search').get(atlasSearchCourse);
router.route('/autocomplete').get(atlasAutocomplete);
router.use(protect);
router.route('/learn/:userId/:courseId').get(getLectureCourse);
router.route('/mylearning/:userId').get(getMyLearningCourse);
router
    .route('/:id/resources')
    .patch(requirePermission('courses', 'update'), upload.single('imageCover'), resizePhoto, uploadResources);
router
    .route('/:id')
    .get(getCourse)
    .patch(requirePermission('courses', 'update'), sanitizeRichText(['description']), updateCourse)
    .delete(requirePermission('courses', 'delete'), deleteCourse);
router.patch('/:id/submit-review', requirePermission('courses', 'publish'), submitForReview);
router.patch('/:id/publish', requirePermission('courses', 'publish'), publishCourse);
router.patch('/:id/archive', requirePermission('courses', 'archive'), archiveCourse);
router.post('/:id/modules/:moduleIndex/generate-quiz', requirePermission('courses', 'update'), triggerQuizGeneration);
router.get('/:id/modules/:moduleIndex/quiz', getQuiz);
export default router;
//# sourceMappingURL=courseRoutes.js.map