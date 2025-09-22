import express from 'express';
import {
  createTag,
  getAllTags,
  updateTag,
  getTag,
  deleteTag,
} from '../Controllers/tagController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getAllTags).post(protect, restrictTo(['admin']), createTag);

router.use(protect);
router
  .route('/:id')
  .get(getTag)
  .patch(restrictTo(['admin']), updateTag)
  .delete(restrictTo(['admin']), deleteTag);

export default router;
