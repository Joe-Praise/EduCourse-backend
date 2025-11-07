import jwt from 'jsonwebtoken';
import { NextFunction, Response, Request } from 'express';
import  catchAsync from '../utils/catchAsync.js';
import  AppError from '../utils/appError.js';
import { JwtPayload } from '../utils/helper.js';
import { User } from '../models/userModel.js';
import { PERMISSION_MATRIX, RoleType } from '../utils/constants.js';
import redis from '../config/redis.js';

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //Session-based authentication (browser)
  if(req.session?.user){
    return next();
  };

  // 1) Get token from headers or cookies
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  try {
    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token does not exist.', 401),
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401),
      );
    }

    // 5) Grant access to protected route
    // req.session?.user = currentUser;
      req.session.user = {
        id: currentUser.id,
        role: currentUser.role,
        username: currentUser.name
      };
      
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

/**
 * Role-Based Access Control (RBAC) System with True Resource-Action Enforcement
 * Implements hierarchical permissions with granular resource-action control
 */

// Role hierarchy for enterprise RBAC - higher number = more permissions
const ROLE_HIERARCHY: Record<RoleType, number> = {
  'user': 1,
  'instructor': 5,
  'admin': 10,
} as const;

// Redis cache configuration for permissions
const CACHE_TTL = 5 * 60; // 5 minutes in seconds (Redis TTL format)
const CACHE_PREFIX = 'auth:perm:';

interface PermissionOptions {
  requireAll?: boolean; // Require ALL roles vs ANY role
  hierarchical?: boolean; // Use role hierarchy
  resource?: string; // Specific resource being accessed
  action?: string; // Specific action being performed
}

/**
 * Enterprise permission checker with TRUE resource-action enforcement
 * @param userRoles - User's assigned roles
 * @param resource - Resource being accessed (e.g., 'courses', 'users')
 * @param action - Action being performed (e.g., 'read', 'write', 'delete')
 * @param options - Permission check options
 */
const hasResourcePermission = (
  userRoles: RoleType[],
  resource: string,
  action: string,
  options: PermissionOptions = {}
): boolean => {
  const { hierarchical = true } = options;

  if (!userRoles?.length) return false;


  // Check if resource exists in permission matrix
  if (!PERMISSION_MATRIX[resource]) {
    console.warn(`Resource '${resource}' not found in permission matrix`);
    return false;
  }

  // Check if action exists for this resource
  if (!PERMISSION_MATRIX[resource][action]) {
    console.warn(`Action '${action}' not allowed on resource '${resource}'`);
    return false;
  }

  // Get allowed roles for this resource-action combination
  const allowedRoles = PERMISSION_MATRIX[resource][action];

  if (hierarchical) {
    // Get user's highest permission level
    const userMaxLevel = Math.max(
      ...userRoles.map(role => ROLE_HIERARCHY[role] || 0)
    );
    
    // Get minimum required level for this resource-action
    const requiredMinLevel = Math.min(
      ...allowedRoles.map(role => ROLE_HIERARCHY[role] || Infinity)
    );
    
    return userMaxLevel >= requiredMinLevel;
  } else {
    // Non-hierarchical: exact role matching
    return allowedRoles.some(role => userRoles.includes(role));
  }
};

/**
 * Legacy role-only permission checker (for backward compatibility)
 * @param userRoles - User's assigned roles
 * @param requiredRoles - Required roles for access
 * @param options - Permission check options
 */
const hasPermission = (
  userRoles: RoleType[],
  requiredRoles: RoleType[],
  options: PermissionOptions = {}
): boolean => {
  const { requireAll = false, hierarchical = true } = options;

  if (!userRoles?.length) return false;

  if (hierarchical) {
    // Get highest user role level
    const userMaxLevel = Math.max(
      ...userRoles.map(role => ROLE_HIERARCHY[role] || 0)
    );
    
    // Get required minimum level
    const requiredMinLevel = Math.min(
      ...requiredRoles.map(role => ROLE_HIERARCHY[role] || Infinity)
    );
    
    return userMaxLevel >= requiredMinLevel;
  }

  // Non-hierarchical: exact role matching
  if (requireAll) {
    return requiredRoles.every(role => userRoles.includes(role));
  } else {
    return requiredRoles.some(role => userRoles.includes(role));
  }
};

/**
 * Generates cache key for permission check
 */
const getCacheKey = (
  userId: string,
  roles: RoleType[],
  resource?: string,
  action?: string
): string => {
  return `${CACHE_PREFIX}${userId}:${roles.join(',')}:${resource || 'any'}:${action || 'any'}`;
};

/**
 * Redis cache utility functions
 */
const getFromCache = async (key: string): Promise<boolean | string | null> => {
  try {
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.warn('⚠️ Redis cache read error:', error);
    return null;
  }
};

const setInCache = async (key: string, value: boolean): Promise<void> => {
  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(value));
  } catch (error) {
    console.warn('⚠️ Redis cache write error:', error);
  }
};

const deleteFromCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('⚠️ Redis cache delete error:', error);
  }
};

/**
 * Role restriction middleware with caching and hierarchy
 * @param roles - Required roles for access
 * @param options - Permission configuration options
 */
export const restrictTo = (
  roles: RoleType[],
  options: PermissionOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Early validation
    if (!req.session?.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!req.session?.user.role || !Array.isArray(req.session?.user.role)) {
      return next(new AppError('User role information invalid', 403));
    }

    if (!roles.length) {
      return next(new AppError('No roles specified for access control', 500));
    }

    const userId = req.session?.user.id?.toString();
    const userRoles = req.session?.user.role as RoleType[];
    
    // Check Redis cache first (enterprise optimization)
    const cacheKey = getCacheKey(userId, roles, options.resource, options.action);
    const cachedResult = await getFromCache(cacheKey);
    
    if (cachedResult !== null) {
      if (!cachedResult) {
        return next(new AppError('Insufficient permissions', 403));
      }
      return next();
    }

    // ✅ TRUE RESOURCE-ACTION PERMISSION CHECK
    let isPermitted: boolean;
    
    if (options.resource && options.action) {
      // Use resource-action based permission checking
      isPermitted = hasResourcePermission(userRoles, options.resource, options.action, options);
      
      // Log detailed permission check for enterprise auditing
      console.log(`Permission Check: User ${userId} with roles [${userRoles.join(',')}] attempting '${options.action}' on '${options.resource}' -> ${isPermitted ? 'ALLOWED' : 'DENIED'}`);
    } else {
      // Fallback to legacy role-only checking
      isPermitted = hasPermission(userRoles, roles, options);
      
      console.log(`Legacy Permission Check: User ${userId} with roles [${userRoles.join(',')}] checking roles [${roles.join(',')}] -> ${isPermitted ? 'ALLOWED' : 'DENIED'}`);
    }
    
    // Cache result in Redis for performance (with TTL)
    await setInCache(cacheKey, isPermitted);

    if (!isPermitted) {
      // Log unauthorized access attempt (enterprise security)
      console.warn(`Unauthorized access attempt: User ${userId} with roles [${userRoles.join(',')}] tried to access resource requiring [${roles.join(',')}]`);
      
      return next(
        new AppError('You do not have permission to perform this action!', 403),
      );
    }
    
    next();
  };
};

/**
 * TRUE Resource-Action permission middleware
 * @param resource - Specific resource being accessed
 * @param action - Action being performed (read, write, delete, etc.)
 */
export const requirePermission = (
  resource: string,
  action: string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Early validation
    if (!req.session?.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!req.session?.user.role || !Array.isArray(req.session?.user.role)) {
      return next(new AppError('User role information invalid', 403));
    }

    const userId = req.session?.user.id;
    const userRoles = req.session?.user.role as RoleType[];
    
    // Check Redis cache first
    const cacheKey = getCacheKey(userId, [], resource, action);
    const cachedResult = await getFromCache(cacheKey);
    
    if (cachedResult !== null) {
      if (!cachedResult) {
        return next(new AppError(`Access denied: Cannot '${action}' on '${resource}'`, 403));
      }
      return next();
    }

    // ✅ ACTUAL RESOURCE-ACTION PERMISSION CHECK
    const isPermitted = hasResourcePermission(userRoles, resource, action, { hierarchical: true });
    
    // Cache result in Redis
    await setInCache(cacheKey, isPermitted);

    if (!isPermitted) {
      // Enterprise security logging
      console.warn(`🚫 UNAUTHORIZED ACCESS: User ${userId} with roles [${userRoles.join(',')}] attempted '${action}' on '${resource}' - BLOCKED`);
      
      return next(
        new AppError(`Access denied: You cannot '${action}' on '${resource}'. Required roles: [${PERMISSION_MATRIX[resource]?.[action]?.join(', ') || 'undefined'}]`, 403),
      );
    }
    
    // Success logging
    console.log(`✅ AUTHORIZED ACCESS: User ${userId} performing '${action}' on '${resource}'`);
    next();
  };
};

/**
 * Owner-based access control - user can access their own resources
 * @param roles - Fallback roles if not owner
 */
export const requireOwnerOrRole = (roles: RoleType[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session?.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userId = req.session?.user.id;
    const resourceUserId = req.params.userId || req.body.userId || req.query.userId;

    // Allow if user is accessing their own resource
    if (userId === resourceUserId) {
      return next();
    }

    // Otherwise, check role permissions
    return await restrictTo(roles)(req, res, next);
  };
};

/**
 * Clears permission cache for a specific user (call on role changes)
 * @param userId - User ID to clear cache for
 */
export const clearUserPermissionCache = async (userId: string): Promise<void> => {
  try {
    // Get all keys matching the user pattern
    const pattern = `${CACHE_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️ Cleared ${keys.length} permission cache entries for user ${userId}`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear user permission cache:', error);
  }
};

/**
 * Clears all permission cache (use for system maintenance)
 */
export const clearAllPermissionCache = async (): Promise<void> => {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️ Cleared all ${keys.length} permission cache entries`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear all permission cache:', error);
  }
};

/**
 * Get permission cache statistics
 */
export const getPermissionCacheStats = async (): Promise<{
  totalKeys: number;
  keysByUser: Record<string, number>;
}> => {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);
    
    const keysByUser: Record<string, number> = {};
    
    keys.forEach(key => {
      // Extract userId from key pattern: auth:perm:userId:roles:resource:action
      const parts = key.split(':');
      if (parts.length >= 3) {
        const userId = parts[2];
        keysByUser[userId] = (keysByUser[userId] || 0) + 1;
      }
    });
    
    return {
      totalKeys: keys.length,
      keysByUser
    };
  } catch (error) {
    console.warn('⚠️ Failed to get permission cache stats:', error);
    return { totalKeys: 0, keysByUser: {} };
  }
};

// Export utilities for advanced use cases
export { hasPermission, hasResourcePermission, ROLE_HIERARCHY, PERMISSION_MATRIX };
export type { PermissionOptions };

