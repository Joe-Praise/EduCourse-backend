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
} = require('../Controllers/instructorController');
const { Protect, restrictTo } = require('../Controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(getAllInstructors)
  .post(Protect, restrictTo('admin', 'instructor'), createInstructor);

router.patch('/updateMe', Protect, updateMe);
router.delete('/deleteMe', Protect, deleteMe);
router.delete(
  '/:id/suspendInstructor',
  Protect,
  restrictTo('admin'),
  suspendInstructor,
);
router
  .route('/:id')
  .get(getOneInstructor)
  .patch(Protect, restrictTo('admin', 'instructor'), updateInstructor)
  .delete(Protect, restrictTo('admin', 'instructor'), deleteinstructor);

module.exports = router;
