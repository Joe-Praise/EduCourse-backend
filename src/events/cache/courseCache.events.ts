import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder";
import { cacheManager } from "../../utils/cacheManager";
import { appEvents } from "..";
import {CacheEvent} from './cache.events';


appEvents.on(CacheEvent.COURSE.CREATED, async (course) => {
  const listKey = CacheKeyBuilder.listKey("courses");
  await cacheManager.addToList(listKey, course);
});

appEvents.on(CacheEvent.COURSE.UPDATED, async (course) => {
  const singleKey = CacheKeyBuilder.resourceKey("courses", course._id);
  const listKey = CacheKeyBuilder.listKey("courses");

  await cacheManager.set(singleKey, course);
  await cacheManager.updateList(listKey, course);
});

appEvents.on(CacheEvent.COURSE.DELETED, async (courseId) => {
  const singleKey = CacheKeyBuilder.resourceKey("courses", courseId);
  const listKey = CacheKeyBuilder.listKey("courses");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((c) => c._id !== courseId);
    await cacheManager.set(listKey, filtered);
  }
});