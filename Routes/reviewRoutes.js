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

router.use(Protect);

router
  .route('/')
  .get(getAllReview)
  .post(restrictTo('user'), setCourseUserIds, createReview);

router.route('/:id').patch(updateReview).get(getReview).delete(deleteReview);

module.exports = router;
