import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import { addToWishlist, removeFromWishlist, getWishlistByUser, checkWishlist, } from '../Controllers/wishlistController.js';
const router = express.Router();
router.use(strictXssSanitizer);
router.use(protect);
router.route('/').get(getWishlistByUser).post(addToWishlist);
router.route('/check').get(checkWishlist);
router.route('/:id').delete(removeFromWishlist);
export default router;
//# sourceMappingURL=wishlistRoutes.js.map