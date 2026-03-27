import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from "./cache.events.js";

appEvents.on(CacheEvent.USER.UPDATED, async (user) => {
  const singleKey = CacheKeyBuilder.resourceKey("user", user._id.toString());
  const listKey = CacheKeyBuilder.listKey("user");

  await cacheManager.set(singleKey, user);
  await cacheManager.updateList(listKey, user);
});

appEvents.on(CacheEvent.USER.DELETED, async (userId) => {
  const singleKey = CacheKeyBuilder.resourceKey("user", userId);
  const listKey = CacheKeyBuilder.listKey("user");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((u) => u._id !== userId);
    await cacheManager.set(listKey, filtered);
  }
});
