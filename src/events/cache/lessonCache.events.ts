import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.LESSON.CREATED, async (lesson) => {
  const singleKey = CacheKeyBuilder.resourceKey("lesson", lesson._id.toString());
  const listKey = CacheKeyBuilder.listKey("lesson");

  await cacheManager.set(singleKey, lesson);
  await cacheManager.addToList(listKey, lesson);
});

appEvents.on(CacheEvent.LESSON.UPDATED, async (lesson) => {
  const singleKey = CacheKeyBuilder.resourceKey("lesson", lesson._id.toString());
  const listKey = CacheKeyBuilder.listKey("lesson");

  await cacheManager.set(singleKey, lesson);
  await cacheManager.updateList(listKey, lesson);
});

appEvents.on(CacheEvent.LESSON.DELETED, async (lessonId) => {
  const singleKey = CacheKeyBuilder.resourceKey("lesson", lessonId);
  const listKey = CacheKeyBuilder.listKey("lesson");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((l) => l._id !== lessonId);
    await cacheManager.set(listKey, filtered);
  }
});