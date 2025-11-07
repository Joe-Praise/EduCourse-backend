# Authentication Middleware Redis Caching Migration

This document outlines the migration from in-memory caching to Redis caching for the authentication middleware.

## Overview

The authentication middleware has been updated to use Redis instead of an in-memory Map for caching permission checks. This provides several benefits for production environments.

## Changes Made

### 1. Cache Storage Migration
- **Before**: In-memory `Map<string, boolean>` with `setTimeout` for TTL
- **After**: Redis with built-in TTL support using `SETEX`

### 2. Cache Configuration
```typescript
// Before
const permissionCache = new Map<string, boolean>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// After
const CACHE_TTL = 5 * 60; // 5 minutes in seconds (Redis format)
const CACHE_PREFIX = 'auth:perm:';
```

### 3. Function Signatures Updated
All caching functions are now async to support Redis operations:
- `restrictTo()` returns async middleware
- `requirePermission()` returns async middleware  
- `requireOwnerOrRole()` returns async middleware
- `clearUserPermissionCache()` is now async

### 4. Cache Operations
```typescript
// Before: Synchronous Map operations
const cachedResult = permissionCache.get(cacheKey);
permissionCache.set(cacheKey, isPermitted);
permissionCache.delete(cacheKey);

// After: Async Redis operations with error handling
const cachedResult = await getFromCache(cacheKey);
await setInCache(cacheKey, isPermitted);
await deleteFromCache(cacheKey);
```

## Redis Cache Key Structure

Cache keys follow this pattern:
```
auth:perm:{userId}:{roles}:{resource}:{action}
```

**Examples:**
- `auth:perm:64f7b8c123456789:admin:courses:write`
- `auth:perm:64f7b8c123456789:user,instructor:any:any`

## New Features

### 1. Enhanced Cache Clearing
```typescript
// Clear specific user's permissions
await clearUserPermissionCache(userId);

// Clear all permission cache
await clearAllPermissionCache();
```

### 2. Cache Statistics
```typescript
const stats = await getPermissionCacheStats();
console.log('Cache stats:', stats);
// Output: { totalKeys: 150, keysByUser: { "user1": 25, "user2": 30 } }
```

### 3. Error Handling
- Graceful fallback if Redis is unavailable
- Detailed error logging
- Cache operations don't break authentication flow

## Benefits of Redis Migration

### 1. **Scalability**
- Shared cache across multiple server instances
- No memory limitations of single process
- Horizontal scaling support

### 2. **Persistence**
- Cache survives server restarts
- Configurable persistence options
- Better cache hit ratios

### 3. **Performance**
- Built-in TTL management
- Efficient pattern-based key operations
- Memory-optimized storage

### 4. **Monitoring**
- Cache statistics and insights
- Key pattern analysis
- Easy cache debugging

### 5. **Maintenance**
- Granular cache invalidation
- System-wide cache clearing
- User-specific cache management

## Usage Examples

### Basic Permission Check (No Changes Required)
```typescript
// Usage remains the same for consumers
app.get('/admin/users', 
  restrictTo(['admin'], { resource: 'users', action: 'read' }),
  getUsersController
);
```

### Cache Management
```typescript
// Clear user cache when roles change
export const updateUserRoles = async (userId, newRoles) => {
  await User.findByIdAndUpdate(userId, { role: newRoles });
  await clearUserPermissionCache(userId); // Clear cached permissions
};

// System maintenance
export const maintenanceFlushCache = async () => {
  await clearAllPermissionCache();
  console.log('Permission cache cleared for maintenance');
};

// Monitoring
export const getCacheHealth = async () => {
  const stats = await getPermissionCacheStats();  
  return {
    healthy: stats.totalKeys < 10000, // Example health check
    ...stats
  };
};
```

## Migration Considerations

### 1. **Breaking Changes**
- All permission middleware functions are now async
- `clearUserPermissionCache()` must be awaited
- Route handlers using these middlewares remain unchanged

### 2. **Error Handling**
- Redis connection failures won't break authentication
- Warnings logged for cache operation failures
- Graceful degradation to non-cached operation

### 3. **Performance**
- First Redis cache miss may be slightly slower than memory
- Subsequent hits are extremely fast
- Network latency consideration for Redis operations

### 4. **Memory Usage**
- Reduced application memory usage
- Cache moved to Redis server
- Better garbage collection performance

## Testing the Migration

### 1. **Functionality Test**
```bash
# Test permission caching
curl -H "Authorization: Bearer <token>" /api/protected-route
# Check Redis for cache keys
redis-cli KEYS "auth:perm:*"
```

### 2. **Performance Test**
```javascript
// Before: Memory cache
console.time('permission-check');
await checkPermission();
console.timeEnd('permission-check'); // ~0.1ms

// After: Redis cache hit
console.time('permission-check-redis');
await checkPermission();
console.timeEnd('permission-check-redis'); // ~1-2ms (still very fast)
```

### 3. **Resilience Test**
```bash
# Stop Redis and ensure auth still works
docker stop redis
curl -H "Authorization: Bearer <token>" /api/protected-route
# Should work but without caching benefits
```

## Configuration

Ensure Redis is configured in `config/redis.ts`:
```typescript
import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  // Add authentication if needed
  // password: process.env.REDIS_PASSWORD,
});
```

## Monitoring Commands

```bash
# View all permission cache keys
redis-cli KEYS "auth:perm:*"

# Get cache key count
redis-cli EVAL "return #redis.call('keys', 'auth:perm:*')" 0

# Clear all permission cache
redis-cli EVAL "local keys = redis.call('keys', 'auth:perm:*'); if #keys > 0 then redis.call('del', unpack(keys)) end; return #keys" 0

# Monitor cache activity
redis-cli MONITOR | grep "auth:perm"
```

The migration maintains full backward compatibility for consumers while providing enhanced caching capabilities for production environments.