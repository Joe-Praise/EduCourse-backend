import { CacheKeyBuilder } from "../../utils/cacheKeyBuilder.js";
import { cacheManager } from "../../utils/cacheManager.js";
import { appEvents } from "../index.js";
import { CacheEvent } from "./cache.events.js";
appEvents.on(CacheEvent.COMPLETED_COURSE.CREATED, async (completedCourse) => {
    const singleKey = CacheKeyBuilder.resourceKey("completedcourse", completedCourse._id.toString());
    const listKey = CacheKeyBuilder.listKey("completedcourse");
    await cacheManager.set(singleKey, completedCourse);
    await cacheManager.addToList(listKey, completedCourse);
});
appEvents.on(CacheEvent.COMPLETED_COURSE.DELETED, async (completedCourseId) => {
    const singleKey = CacheKeyBuilder.resourceKey("completedcourse", completedCourseId);
    const listKey = CacheKeyBuilder.listKey("completedcourse");
    await cacheManager.remove(singleKey);
    const list = await cacheManager.get(listKey);
    if (list) {
        const filtered = list.filter((c) => c._id !== completedCourseId);
        await cacheManager.set(listKey, filtered);
    }
});
//# sourceMappingURL=completedCourseCache.events.js.map