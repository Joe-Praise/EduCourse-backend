const express = require('express');
const { Protect } = require('../Controllers/authController');
const {
  getAllLinks,
  createLink,
  getLink,
  updateLink,
  deleteLink,
} = require('../Controllers/linkController');

const router = express.Router();

router.route('/').get(getAllLinks).post(createLink);

router
  .route('/id')
  .get(getLink)
  .patch(Protect, updateLink)
  .delete(Protect, deleteLink);

module.exports = router;
