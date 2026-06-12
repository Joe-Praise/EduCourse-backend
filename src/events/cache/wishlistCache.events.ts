import { CacheKeyBuilder } from '../../utils/cacheKeyBuilder.js';
import { cacheManager } from '../../utils/cacheManager.js';
import { appEvents } from '../index.js';
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.WISHLIST.CREATED, async (wishlist) => {
  const singleKey = CacheKeyBuilder.resourceKey('wishlist', wishlist._id.toString());
  const userListKey = CacheKeyBuilder.listKey('wishlist', { userId: wishlist.userId?.toString() });

  await cacheManager.set(singleKey, wishlist);
  await cacheManager.remove(userListKey);
});

appEvents.on(CacheEvent.WISHLIST.DELETED, async (wishlistId) => {
  const singleKey = CacheKeyBuilder.resourceKey('wishlist', wishlistId);
  await cacheManager.remove(singleKey);
});
