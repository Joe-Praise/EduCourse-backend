import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from './handlerFactory';

// Import CommonJS modules
const Tag = require('../models/tagModel');

export const createTag = createOne(Tag);

export const getAllTags = getAll(Tag);

export const getTag = getOne(Tag);

export const updateTag = updateOne(Tag);

export const deleteTag = deleteOne(Tag);
