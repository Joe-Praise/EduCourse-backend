const express = require('express');
const {
  getAllCategory,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  getMyLearningCategory,
} = require('../Controllers/categoryController');
const { Protect, restrictTo } = require('../Controllers/authController');

const router = express.Router();
router.route('/').get(getAllCategory).post(Protect, createCategory);

router.use(Protect);
router.get('/registered/:userId', getMyLearningCategory);

router
  .route('/:id')
  .get(getCategory)
  .patch(updateCategory)
  .delete(restrictTo('admin'), deleteCategory);

module.exports = router;
