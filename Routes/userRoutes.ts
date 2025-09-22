import express from 'express';

import {
  signup,
  login,
  updatePassword,
  checkToken,
} from '../Controllers/authController.js';

import { protect, requirePermission, restrictTo } from '../middlewares/authMiddleware.js';

import {
  getUser,
  getMe,
  updateMe,
  deleteMe,
  getAllUsers,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  resizePhoto,
  getProfile,
} from '../Controllers/userController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.route('/:userId/profile').get(getProfile);

// Protects all routes after this middleware
router.use(protect);

router.patch('/updateMyPassword', updatePassword);
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
