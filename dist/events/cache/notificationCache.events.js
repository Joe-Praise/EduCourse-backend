import { CacheKeyBuilder } from '../../utils/cacheKeyBuilder.js';
import { cacheManager } from '../../utils/cacheManager.js';
import { appEvents } from '../index.js';
import { CacheEvent } from './cache.events.js';
appEvents.on(CacheEvent.NOTIFICATION.CREATED, async (notification) => {
    const singleKey = CacheKeyBuilder.resourceKey('notifications', notification._id.toString());
    const userListKey = CacheKeyBuilder.listKey('notifications', {
        userId: notification.userId?.toString(),
    });
    await cacheManager.set(singleKey, notification);
    // Invalidate the user's list so the new notification appears immediately
    await cacheManager.remove(userListKey);
    // Invalidate unread count key
    const unreadKey = CacheKeyBuilder.resourceKey('notifications-unread', notification.userId?.toString());
    await cacheManager.remove(unreadKey);
});
appEvents.on(CacheEvent.NOTIFICATION.UPDATED, async (notification) => {
    const singleKey = CacheKeyBuilder.resourceKey('notifications', notification._id.toString());
    await cacheManager.set(singleKey, notification);
    // Invalidate unread count
    const unreadKey = CacheKeyBuilder.resourceKey('notifications-unread', notification.userId?.toString());
    await cacheManager.remove(unreadKey);
});
appEvents.on(CacheEvent.NOTIFICATION.DELETED, async (notificationId) => {
    const singleKey = CacheKeyBuilder.resourceKey('notifications', notificationId);
    await cacheManager.remove(singleKey);
});
//# sourceMappingURL=notificationCache.events.js.map