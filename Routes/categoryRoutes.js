const express = require('express');
const {
  getAllCategory,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} = require('../Controllers/categoryController');
const { Protect, restrictTo } = require('../Controllers/authController');

const router = express.Router();
router.use(Protect);
router.route('/').get(getAllCategory).post(createCategory);

router
  .route('/:id')
  .get(getCategory)
  .patch(updateCategory)
  .delete(restrictTo('admin'), deleteCategory);

module.exports = router;
