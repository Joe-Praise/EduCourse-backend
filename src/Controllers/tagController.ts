import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from './handlerFactory.js';
import { Tag } from "../models/tagModel.js";
import { CacheEvent } from '../events/cache/cache.events.js';

// Import cache events to register listeners
import '../events/cache/tagCache.events.js';

export const createTag = createOne(Tag, { cachePattern: CacheEvent.TAG.CREATED });

export const getAllTags = getAll(Tag);

export const getTag = getOne(Tag, { modelName: 'tag' });

export const updateTag = updateOne(Tag, { cachePattern: CacheEvent.TAG.UPDATED });

export const deleteTag = deleteOne(Tag, { cachePattern: CacheEvent.TAG.DELETED });
