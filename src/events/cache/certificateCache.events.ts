import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from "./cache.events.js";

appEvents.on(CacheEvent.CERTIFICATE.CREATED, async (certificate) => {
  const singleKey = CacheKeyBuilder.resourceKey(
    "certificate",
    certificate._id.toString()
  );
  const listKey = CacheKeyBuilder.listKey("certificate");

  await cacheManager.set(singleKey, certificate);
  await cacheManager.addToList(listKey, certificate);
});

appEvents.on(CacheEvent.CERTIFICATE.UPDATED, async (certificate) => {
  const singleKey = CacheKeyBuilder.resourceKey(
    "certificate",
    certificate._id.toString()
  );
  const listKey = CacheKeyBuilder.listKey("certificate");

  await cacheManager.set(singleKey, certificate);
  await cacheManager.updateList(listKey, certificate);
});

appEvents.on(CacheEvent.CERTIFICATE.DELETED, async (certificateId) => {
  const singleKey = CacheKeyBuilder.resourceKey("certificate", certificateId);
  const listKey = CacheKeyBuilder.listKey("certificate");

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((c) => c._id !== certificateId);
    await cacheManager.set(listKey, filtered);
  }
});
