import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.CATEGORY.CREATED, async (category) => {
  const singleKey = CacheKeyBuilder.resourceKey("category", category._id.toString());
  const listKey = CacheKeyBuilder.listKey("category");

  await cacheManager.set(singleKey, category);
  await cacheManager.addToList(listKey, category);
});

appEvents.on(CacheEvent.CATEGORY.UPDATED, async (category) => {
  const singleKey = CacheKeyBuilder.resourceKey("category", category._id.toString());
  const listKey = CacheKeyBuilder.listKey("category");

  await cacheManager.set(singleKey, category);
  await cacheManager.updateList(listKey, category);
});

appEvents.on(CacheEvent.CATEGORY.DELETED, async (categoryId) => {
  const singleKey = CacheKeyBuilder.resourceKey("category", categoryId);
  const listKey = CacheKeyBuilder.listKey("category");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((c) => c._id !== categoryId);
    await cacheManager.set(listKey, filtered);
  }
});