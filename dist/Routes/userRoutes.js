import express from 'express';
import { signup, login, updatePassword, checkToken, forgotPassword, resetPassword, refreshAccessToken, logout, } from '../Controllers/authController.js';
import { protect, requirePermission } from '../middlewares/authMiddleware.js';
import { getUser, getMe, updateMe, deleteMe, getAllUsers, updateUser, deleteUser, uploadUserPhoto, resizePhoto, getProfile, } from '../Controllers/userController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import { getLearningStreak, getUserBadges } from '../Controllers/streakController.js';
const router = express.Router();
router.use(strictXssSanitizer);
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshAccessToken);
router.post('/logout', logout);
router.post('/forgotPassword', authLimiter, forgotPassword);
router.patch('/resetPassword/:token', authLimiter, resetPassword);
router.route('/:userId/profile').get(getProfile);
// Protects all routes after this middleware
router.use(protect);
router.patch('/updateMyPassword', updatePassword);
router.get('/streak', getLearningStreak);
router.get('/badges', getUserBadges);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizePhoto, updateMe);
router.delete('/deleteMe', deleteMe);
router.get('/checkToken', checkToken);
router.use(requirePermission('users', 'read'));
router.route('/').get(getAllUsers);
router
    .route('/:id')
    .get(getUser)
    .patch(requirePermission('users', 'update'), updateUser)
    .delete(requirePermission('users', 'delete'), deleteUser);
export default router;
//# sourceMappingURL=userRoutes.js.map