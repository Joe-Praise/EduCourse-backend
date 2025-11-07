import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from './handlerFactory.js';

// Import CommonJS modules
import { Tag } from "../models/tagModel.js";

export const createTag = createOne(Tag);

export const getAllTags = getAll(Tag);

export const getTag = getOne(Tag);

export const updateTag = updateOne(Tag);

export const deleteTag = deleteOne(Tag);
