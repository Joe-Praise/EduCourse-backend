import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from "./cache.events.js";
appEvents.on(CacheEvent.BLOG_COMMENT.CREATED, async (comment) => {
    const singleKey = CacheKeyBuilder.resourceKey("blogcomment", comment._id.toString());
    const listKey = CacheKeyBuilder.listKey("blogcomment");
    await cacheManager.set(singleKey, comment);
    await cacheManager.addToList(listKey, comment);
});
appEvents.on(CacheEvent.BLOG_COMMENT.UPDATED, async (comment) => {
    const singleKey = CacheKeyBuilder.resourceKey("blogcomment", comment._id.toString());
    const listKey = CacheKeyBuilder.listKey("blogcomment");
    await cacheManager.set(singleKey, comment);
    await cacheManager.updateList(listKey, comment);
});
appEvents.on(CacheEvent.BLOG_COMMENT.DELETED, async (commentId) => {
    const singleKey = CacheKeyBuilder.resourceKey("blogcomment", commentId);
    const listKey = CacheKeyBuilder.listKey("blogcomment");
    await cacheManager.remove(singleKey);
    const list = await cacheManager.get(listKey);
    if (list) {
        const filtered = list.filter((c) => c._id !== commentId);
        await cacheManager.set(listKey, filtered);
    }
});
//# sourceMappingURL=blogCommentCache.events.js.map