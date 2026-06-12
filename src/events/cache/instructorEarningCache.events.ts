import { CacheKeyBuilder } from '../../utils/cacheKeyBuilder.js';
import { cacheManager } from '../../utils/cacheManager.js';
import { appEvents } from '../index.js';
import { CacheEvent } from './cache.events.js';

appEvents.on(CacheEvent.INSTRUCTOR_EARNING.CREATED, async (earning) => {
  const singleKey = CacheKeyBuilder.resourceKey('instructor-earnings', earning._id.toString());
  await cacheManager.set(singleKey, earning);

  // Invalidate instructor-level analytics and dashboard caches
  const instructorId = earning.instructorId?.toString();
  if (instructorId) {
    const analyticsKey = CacheKeyBuilder.resourceKey('instructor-analytics', instructorId);
    const dashboardKey = CacheKeyBuilder.resourceKey('instructor-dashboard', instructorId);
    await cacheManager.remove(analyticsKey);
    await cacheManager.remove(dashboardKey);
  }
});

appEvents.on(CacheEvent.INSTRUCTOR_EARNING.UPDATED, async (earning) => {
  const singleKey = CacheKeyBuilder.resourceKey('instructor-earnings', earning._id.toString());
  await cacheManager.set(singleKey, earning);

  const instructorId = earning.instructorId?.toString();
  if (instructorId) {
    const analyticsKey = CacheKeyBuilder.resourceKey('instructor-analytics', instructorId);
    const dashboardKey = CacheKeyBuilder.resourceKey('instructor-dashboard', instructorId);
    await cacheManager.remove(analyticsKey);
    await cacheManager.remove(dashboardKey);
  }
});
