import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.BLOG.CREATED, async (blog) => {
  const singleKey = CacheKeyBuilder.resourceKey("blog", blog._id.toString());
  const listKey = CacheKeyBuilder.listKey("blog");

  await cacheManager.set(singleKey, blog);
  await cacheManager.addToList(listKey, blog);
});

appEvents.on(CacheEvent.BLOG.UPDATED, async (blog) => {
  const singleKey = CacheKeyBuilder.resourceKey("blog", blog._id.toString());
  const listKey = CacheKeyBuilder.listKey("blog");

  await cacheManager.set(singleKey, blog);
  await cacheManager.updateList(listKey, blog);
});

appEvents.on(CacheEvent.BLOG.DELETED, async (blogId) => {
  const singleKey = CacheKeyBuilder.resourceKey("blog", blogId);
  const listKey = CacheKeyBuilder.listKey("blog");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((b) => b._id !== blogId);
    await cacheManager.set(listKey, filtered);
  }
});