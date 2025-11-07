import express from 'express';
import {
  getAllCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  uploadResources,
  resizePhoto,
  // searchCourses,
  getLectureCourse,
  // atlasSearchCourse,
  atlasAutocomplete,
  getMyLearningCourse,
} from '../Controllers/courseController.js';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import reviewRouter from './reviewRoutes.js';
import upload from '../utils/handleImageUpload.js';
import { cacheInvalidator } from '../middlewares/cacheInvalidator.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';

const router = express.Router();

router.use('/:courseId/reviews', reviewRouter);
router
  .route('/')
  .get(getAllCourses)
  .post(
    protect, 
    requirePermission('courses', 'create'),
    cacheInvalidator(CacheKeyBuilder.pattern("course")),
    createCourse
  );

// router.route('/search').get(atlasSearchCourse);
router.route('/autocomplete').get(atlasAutocomplete);

router.use(protect);
router.route('/learn/:userId/:courseId').get(getLectureCourse);
router.route('/mylearning/:userId').get(getMyLearningCourse);
router
  .route('/:id/resources')
  .patch(
    requirePermission('courses', 'update'),
    upload.single('imageCover'),
    resizePhoto,
    uploadResources,
  );
router
  .route('/:id')
  .get(getCourse)
  .patch(requirePermission('courses', 'update'), updateCourse)
  .delete(requirePermission('courses', 'delete'), deleteCourse);

export default router;
