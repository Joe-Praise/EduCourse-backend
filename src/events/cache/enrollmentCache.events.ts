import { CacheKeyBuilder } from '../../utils/cacheKeyBuilder.js';
import { cacheManager } from '../../utils/cacheManager.js';
import { appEvents } from '../index.js';
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.ENROLLMENT.CREATED, async (enrollment) => {
  const singleKey = CacheKeyBuilder.resourceKey('enrollments', enrollment._id.toString());
  const listKey = CacheKeyBuilder.listKey('enrollments');
  const userListKey = CacheKeyBuilder.listKey('enrollments', { userId: enrollment.userId?.toString() });

  await cacheManager.set(singleKey, enrollment);
  await cacheManager.addToList(listKey, enrollment);
  await cacheManager.remove(userListKey);

  // Invalidate dashboard cache for the instructor of this course
  const dashboardPattern = CacheKeyBuilder.pattern('instructor-dashboard');
  await cacheManager.remove(dashboardPattern);
});

appEvents.on(CacheEvent.ENROLLMENT.UPDATED, async (enrollment) => {
  const singleKey = CacheKeyBuilder.resourceKey('enrollments', enrollment._id.toString());
  const listKey = CacheKeyBuilder.listKey('enrollments');

  await cacheManager.set(singleKey, enrollment);
  await cacheManager.updateList(listKey, enrollment);
});

appEvents.on(CacheEvent.ENROLLMENT.DELETED, async (enrollmentId) => {
  const singleKey = CacheKeyBuilder.resourceKey('enrollments', enrollmentId);
  const listKey = CacheKeyBuilder.listKey('enrollments');

  await cacheManager.remove(singleKey);
  const list = await cacheManager.get<any[]>(listKey);
  if (list) {
    const filtered = list.filter((e) => e._id !== enrollmentId);
    await cacheManager.set(listKey, filtered);
  }
});
