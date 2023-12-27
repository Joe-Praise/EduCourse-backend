const express = require('express');
const { Protect, restrictTo } = require('../Controllers/authController');
const {
  getAllModules,
  createModule,
  getModule,
  updateModule,
  deleteModule,
} = require('../Controllers/moduleController');

const router = express.Router();

router.use(Protect);
router
  .route('/')
  .get(getAllModules)
  .post(restrictTo('admin', 'instructor'), createModule);

router
  .route('/:id')
  .get(getModule)
  .patch(restrictTo('admin', 'instructor'), updateModule)
  .delete(restrictTo('admin', 'instructor'), deleteModule);

module.exports = router;
