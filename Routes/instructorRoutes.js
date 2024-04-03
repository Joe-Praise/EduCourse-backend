const express = require('express');
const {
  createInstructor,
  getAllInstructors,
  getOneInstructor,
  updateInstructor,
  deleteinstructor,
  updateMe,
  deleteMe,
  suspendInstructor,
  getMyLearningInstructors,
} = require('../Controllers/instructorController');
const { Protect, restrictTo } = require('../Controllers/authController');
const {
  getRegisteredCourse,
} = require('../Controllers/completedCourseController');

const router = express.Router();

router
  .route('/')
  .get(getAllInstructors)
  .post(Protect, restrictTo('admin', 'instructor'), createInstructor);

router.patch('/updateMe', Protect, restrictTo('admin', 'instructor'), updateMe);
router.delete(
  '/deleteMe',
  Protect,
  restrictTo('admin', 'instructor'),
  deleteMe,
);
router.delete(
  '/:id/suspendInstructor',
  Protect,
  restrictTo('admin'),
  suspendInstructor,
);

router.get(
  '/myLearningInstructors/:userId',
  Protect,
  getRegisteredCourse,
  getMyLearningInstructors,
);
router
  .route('/:id')
  .get(getOneInstructor)
  .patch(Protect, restrictTo('admin', 'instructor'), updateInstructor)
  .delete(Protect, restrictTo('admin', 'instructor'), deleteinstructor);

module.exports = router;
