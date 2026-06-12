import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from "./cache.events.js";

appEvents.on(CacheEvent.TAG.CREATED, async (tag) => {
  const singleKey = CacheKeyBuilder.resourceKey("tag", tag._id.toString());
  const listKey = CacheKeyBuilder.listKey("tag");

  await cacheManager.set(singleKey, tag);
  await cacheManager.addToList(listKey, tag);
});

appEvents.on(CacheEvent.TAG.UPDATED, async (tag) => {
  const singleKey = CacheKeyBuilder.resourceKey("tag", tag._id.toString());
  const listKey = CacheKeyBuilder.listKey("tag");

  await cacheManager.set(singleKey, tag);
  await cacheManager.updateList(listKey, tag);
});

appEvents.on(CacheEvent.TAG.DELETED, async (tagId) => {
  const singleKey = CacheKeyBuilder.resourceKey("tag", tagId);
  const listKey = CacheKeyBuilder.listKey("tag");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((t) => t._id !== tagId);
    await cacheManager.set(listKey, filtered);
  }
});
