const Tag = require('../models/tagModel');
const {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} = require('./handlerFactory');

exports.createTag = createOne(Tag);

exports.getAllTags = getAll(Tag);

exports.getTag = getOne(Tag);

exports.updateTag = updateOne(Tag);

exports.deleteTag = deleteOne(Tag);
