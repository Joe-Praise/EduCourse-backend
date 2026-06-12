import { logger } from './logger.js';
/**
 * Redis Cache Management Utilities for Authentication System
 * 
 * This module provides utility functions for managing Redis-based permission caching.
 * Use these utilities for maintenance, monitoring, and debugging.
 */

import redis from '../config/redis.js';

const CACHE_PREFIX = 'auth:perm:';

/**
 * Display all cached permissions in a readable format
 */
export const displayPermissionCache = async (): Promise<void> => {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);
    
    logger.debug(`📊 Found ${keys.length} cached permissions:\n`);
    
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      
      // Parse key components: auth:perm:userId:roles:resource:action
      const parts = key.split(':');
      const userId = parts[2] || 'unknown';
      const roles = parts[3] || 'unknown';
      const resource = parts[4] || 'any';
      const action = parts[5] || 'any';
      
      logger.debug(`🔑 Key: ${key}`);
      logger.debug(`   User: ${userId}`);
      logger.debug(`   Roles: ${roles}`);
      logger.debug(`   Resource: ${resource}`);
      logger.debug(`   Action: ${action}`);
      logger.debug(`   Allowed: ${value}`);
      logger.debug(`   TTL: ${ttl > 0 ? `${ttl}s` : 'expired'}`);
      logger.debug('');
    }
  } catch (error) {
    logger.error('❌ Error displaying cache:', error);
  }
};

/**
 * Clean up expired cache entries (Redis should handle this automatically)
 */
export const cleanExpiredCache = async (): Promise<number> => {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);
    let cleanedCount = 0;
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -2) { // Key expired
        await redis.del(key);
        cleanedCount++;
      }
    }
    
    logger.debug(`🧹 Cleaned ${cleanedCount} expired cache entries`);
    return cleanedCount;
  } catch (error) {
    logger.error('❌ Error cleaning cache:', error);
    return 0;
  }
};

/**
 * Monitor cache hit/miss ratios (simulation for demonstration)
 */
export const monitorCacheMetrics = async (): Promise<{
  totalKeys: number;
  avgTTL: number;
  userDistribution: Record<string, number>;
}> => {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);
    
    let totalTTL = 0;
    const userDistribution: Record<string, number> = {};
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl > 0) totalTTL += ttl;
      
      // Extract user ID for distribution analysis
      const parts = key.split(':');
      if (parts.length >= 3) {
        const userId = parts[2];
        userDistribution[userId] = (userDistribution[userId] || 0) + 1;
      }
    }
    
    return {
      totalKeys: keys.length,
      avgTTL: keys.length > 0 ? Math.round(totalTTL / keys.length) : 0,
      userDistribution
    };
  } catch (error) {
    logger.error('❌ Error monitoring metrics:', error);
    return { totalKeys: 0, avgTTL: 0, userDistribution: {} };
  }
};

/**
 * Export cache data for backup/analysis
 */
export const exportCacheData = async (): Promise<Array<{
  key: string;
  value: boolean;
  ttl: number;
  userId: string;
  roles: string;
  resource: string;
  action: string;
}>> => {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);
    const exportData = [];
    
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      
      const parts = key.split(':');
      const userId = parts[2] || 'unknown';
      const roles = parts[3] || 'unknown';
      const resource = parts[4] || 'any';
      const action = parts[5] || 'any';
      
      exportData.push({
        key,
        value: JSON.parse(value || 'false'),
        ttl,
        userId,
        roles,
        resource,
        action
      });
    }
    
    return exportData;
  } catch (error) {
    logger.error('❌ Error exporting cache data:', error);
    return [];
  }
};

/**
 * Test cache performance
 */
export const testCachePerformance = async (iterations: number = 100): Promise<{
  avgWriteTime: number;
  avgReadTime: number;
  avgDeleteTime: number;
}> => {
  const testKey = `${CACHE_PREFIX}test:performance`;
  
  // Test write performance
  const writeStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await redis.set(`${testKey}:${i}`, JSON.stringify(true), { EX: 60 });
  }
  const writeTime = Date.now() - writeStart;
  
  // Test read performance
  const readStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await redis.get(`${testKey}:${i}`);
  }
  const readTime = Date.now() - readStart;
  
  // Test delete performance
  const deleteStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await redis.del(`${testKey}:${i}`);
  }
  const deleteTime = Date.now() - deleteStart;
  
  return {
    avgWriteTime: Number((writeTime / iterations).toFixed(2)),
    avgReadTime: Number((readTime / iterations).toFixed(2)),
    avgDeleteTime: Number((deleteTime / iterations).toFixed(2))
  };
};

// CLI-style usage examples
if (process.argv.includes('--display')) {
  displayPermissionCache();
}

if (process.argv.includes('--clean')) {
  cleanExpiredCache();
}

if (process.argv.includes('--monitor')) {
  monitorCacheMetrics().then(metrics => {
    logger.debug('📈 Cache Metrics:', metrics);
  });
}

if (process.argv.includes('--test-performance')) {
  testCachePerformance(50).then(results => {
    logger.debug('⚡ Performance Test Results:', results);
  });
}