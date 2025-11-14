import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.REVIEW.CREATED, async (review) => {
  const singleKey = CacheKeyBuilder.resourceKey("review", review._id.toString());
  const listKey = CacheKeyBuilder.listKey("review");

  await cacheManager.set(singleKey, review);
  await cacheManager.addToList(listKey, review);
});

appEvents.on(CacheEvent.REVIEW.UPDATED, async (review) => {
  const singleKey = CacheKeyBuilder.resourceKey("review", review._id.toString());
  const listKey = CacheKeyBuilder.listKey("review");

  await cacheManager.set(singleKey, review);
  await cacheManager.updateList(listKey, review);
});

appEvents.on(CacheEvent.REVIEW.DELETED, async (reviewId) => {
  const singleKey = CacheKeyBuilder.resourceKey("review", reviewId);
  const listKey = CacheKeyBuilder.listKey("review");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((r) => r._id !== reviewId);
    await cacheManager.set(listKey, filtered);
  }
});