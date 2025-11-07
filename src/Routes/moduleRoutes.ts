import express from 'express';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import {
  getAllModules,
  createModule,
  getModule,
  updateModule,
  deleteModule,
  // getLectureModules,
  // getAllLectureModules,
} from '../Controllers/moduleController.js';

const router = express.Router();

router.route('/').get(getAllModules);
router.use(protect);

// router.route('/lecture').get(getAllLectureModules);
// router.route('/lecture').get(getLectureModules);

router.route('/').post(requirePermission('lessons', 'create'), createModule);

router
  .route('/:id')
  .get(getModule)
  .patch(requirePermission('lessons', 'update'), updateModule)
  .delete(requirePermission('lessons', 'delete'), deleteModule);

export default router;
