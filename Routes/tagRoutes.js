const express = require('express');
const {
  createTag,
  getAllTags,
  updateTag,
  getTag,
  deleteTag,
} = require('../Controllers/tagController');
const { Protect, restrictTo } = require('../Controllers/authController');

const router = express.Router();

router.route('/').get(getAllTags).post(Protect, restrictTo('admin'), createTag);

router.use(Protect);
router
  .route('/:id')
  .get(getTag)
  .patch(restrictTo('admin'), updateTag)
  .delete(restrictTo('admin'), deleteTag);

module.exports = router;
