import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.MODULE.CREATED, async (module) => {
  const singleKey = CacheKeyBuilder.resourceKey("module", module._id.toString());
  const listKey = CacheKeyBuilder.listKey("module");

  await cacheManager.set(singleKey, module);
  await cacheManager.addToList(listKey, module);
});

appEvents.on(CacheEvent.MODULE.UPDATED, async (module) => {
  const singleKey = CacheKeyBuilder.resourceKey("module", module._id.toString());
  const listKey = CacheKeyBuilder.listKey("module");

  await cacheManager.set(singleKey, module);
  await cacheManager.updateList(listKey, module);
});

appEvents.on(CacheEvent.MODULE.DELETED, async (moduleId) => {
  const singleKey = CacheKeyBuilder.resourceKey("module", moduleId);
  const listKey = CacheKeyBuilder.listKey("module");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((m) => m._id !== moduleId);
    await cacheManager.set(listKey, filtered);
  }
});