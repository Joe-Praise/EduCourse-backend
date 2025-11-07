# Redis Caching Implementation for Landing Page

This document describes the Redis caching implementation for the landing page data to improve API performance.

## Overview

The landing page controller now implements Redis caching with the following features:

- **Cache Duration**: 5 minutes (300 seconds)
- **Cache Key**: `landing-page-data`
- **Fallback**: Graceful fallback to database if Redis fails
- **Cache Invalidation**: Automatic cache clearing when data is updated

## Cache Structure

The cached data includes:
- **Courses**: Latest 6 courses
- **Blogs**: Latest 6 blogs  
- **Instructors**: Latest 4 instructors
- **Categories**: Latest 6 categories

## Performance Benefits

- **First Request**: Fetches from database, caches result (normal response time)
- **Subsequent Requests**: Serves from Redis cache (significantly faster)
- **Cache Miss**: Automatically refreshes cache with new data

## Response Format

```json
{
  "status": "success",
  "data": {
    "courses": [...],
    "blogs": [...],
    "instructors": [...],
    "categories": [...]
  },
  "cached": true/false  // Indicates if data was served from cache
}
```

## Cache Invalidation

### Automatic Invalidation
The cache is automatically invalidated when:
- Courses are created, updated, or deleted
- Other data types can be similarly integrated

### Manual Invalidation Functions

```typescript
import { 
  invalidateLandingPageCache,
  invalidateCoursesCache,
  invalidateBlogsCache,
  invalidateInstructorsCache,
  invalidateCategoriesCache
} from '../Controllers/landingPageController.js';

// Invalidate entire landing page cache
await invalidateLandingPageCache();

// Invalidate specific data type (also clears main cache)
await invalidateCoursesCache();
await invalidateBlogsCache();
await invalidateInstructorsCache();
await invalidateCategoriesCache();
```

## Integration with Other Controllers

### Example: Blog Controller Integration

```typescript
import { invalidateBlogsCache } from './landingPageController.js';

export const createBlog = catchAsync(async (req, res, next) => {
  // Create blog logic here...
  
  // Invalidate cache after successful creation
  if (res.statusCode >= 200 && res.statusCode < 300) {
    await invalidateBlogsCache();
  }
});
```

### Example: Instructor Controller Integration

```typescript
import { invalidateInstructorsCache } from './landingPageController.js';

export const updateInstructor = catchAsync(async (req, res, next) => {
  // Update instructor logic here...
  
  // Invalidate cache after successful update
  if (res.statusCode >= 200 && res.statusCode < 300) {
    await invalidateInstructorsCache();
  }
});
```

## Error Handling

- Redis connection failures don't break the API
- Falls back to database queries if Redis is unavailable
- Logs warnings for Redis errors while maintaining functionality

## Monitoring

The implementation includes console logging for:
- ✅ Cache hits (serving from Redis)
- 🔄 Cache misses (fetching from database)
- 💾 Cache storage (saving to Redis)
- 🗑️ Cache invalidation (clearing cache)
- ⚠️ Redis errors (fallback scenarios)

## Configuration

Redis configuration is in `config/redis.ts`:
```typescript
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});
```

## Testing the Implementation

1. **First request**: Should see "Fetching from database" and `"cached": false`
2. **Second request**: Should see "Serving from cache" and `"cached": true`
3. **After data update**: Cache invalidated, next request fetches fresh data
4. **Redis down**: Should still work with database fallback

## Future Enhancements

- Implement cache warming strategies
- Add cache statistics and monitoring
- Implement distributed caching for multiple server instances
- Add cache versioning for complex invalidation scenarios