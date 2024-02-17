const express = require('express');
const { Protect, restrictTo } = require('../Controllers/authController');
const {
  setCourseUserIds,
  createReview,
  getAllReview,
  getReview,
  updateReview,
  deleteReview,
} = require('../Controllers/reviewController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReview)
  .post(Protect, restrictTo('user'), setCourseUserIds, createReview);

router.use(Protect);
router.route('/:id').get(getReview).patch(updateReview).delete(deleteReview);

module.exports = router;
