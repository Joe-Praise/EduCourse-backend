const express = require('express');

const {
  signup,
  login,
  Protect,
  restrictTo,
  updatePassword,
} = require('../Controllers/authController');

const {
  getUser,
  getMe,
  updateMe,
  deleteMe,
  getAllUsers,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  resizePhoto,
} = require('../Controllers/userController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// Protects all routes after this middleware
router.use(Protect);

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizePhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));
router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
