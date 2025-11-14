import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.INSTRUCTOR.CREATED, async (instructor) => {
  const singleKey = CacheKeyBuilder.resourceKey("instructor", instructor._id.toString());
  const listKey = CacheKeyBuilder.listKey("instructor");

  await cacheManager.set(singleKey, instructor);
  await cacheManager.addToList(listKey, instructor);
});

appEvents.on(CacheEvent.INSTRUCTOR.UPDATED, async (instructor) => {
  const singleKey = CacheKeyBuilder.resourceKey("instructor", instructor._id.toString());
  const listKey = CacheKeyBuilder.listKey("instructor");

  await cacheManager.set(singleKey, instructor);
  await cacheManager.updateList(listKey, instructor);
});

appEvents.on(CacheEvent.INSTRUCTOR.DELETED, async (instructorId) => {
  const singleKey = CacheKeyBuilder.resourceKey("instructor", instructorId);
  const listKey = CacheKeyBuilder.listKey("instructor");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((i) => i._id !== instructorId);
    await cacheManager.set(listKey, filtered);
  }
});