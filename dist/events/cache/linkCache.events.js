import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from "./cache.events.js";
appEvents.on(CacheEvent.LINK.CREATED, async (link) => {
    const singleKey = CacheKeyBuilder.resourceKey("link", link._id.toString());
    const listKey = CacheKeyBuilder.listKey("link");
    await cacheManager.set(singleKey, link);
    await cacheManager.addToList(listKey, link);
});
appEvents.on(CacheEvent.LINK.UPDATED, async (link) => {
    const singleKey = CacheKeyBuilder.resourceKey("link", link._id.toString());
    const listKey = CacheKeyBuilder.listKey("link");
    await cacheManager.set(singleKey, link);
    await cacheManager.updateList(listKey, link);
});
appEvents.on(CacheEvent.LINK.DELETED, async (linkId) => {
    const singleKey = CacheKeyBuilder.resourceKey("link", linkId);
    const listKey = CacheKeyBuilder.listKey("link");
    await cacheManager.remove(singleKey);
    const list = await cacheManager.get(listKey);
    if (list) {
        const filtered = list.filter((l) => l._id !== linkId);
        await cacheManager.set(listKey, filtered);
    }
});
//# sourceMappingURL=linkCache.events.js.map