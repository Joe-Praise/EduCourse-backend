import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import {
  getAllLinks,
  createLink,
  getLink,
  updateLink,
  deleteLink,
} from '../Controllers/linkController.js';

const router = express.Router();
router.use(strictXssSanitizer);

router.route('/').get(getAllLinks).post(createLink);

router
  .route('/id')
  .get(getLink)
  .patch(protect, updateLink)
  .delete(protect, deleteLink);

export default router;
