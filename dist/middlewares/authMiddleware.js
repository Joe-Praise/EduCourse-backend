"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_MATRIX = exports.ROLE_HIERARCHY = exports.hasResourcePermission = exports.hasPermission = exports.clearUserPermissionCache = exports.requireOwnerOrRole = exports.requirePermission = exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const userModel_1 = require("../models/userModel");
/**
 * Role-Based Access Control (RBAC) System with True Resource-Action Enforcement
 * Implements hierarchical permissions with granular resource-action control
 */
// Role hierarchy for enterprise RBAC - higher number = more permissions
const ROLE_HIERARCHY = {
    'user': 1,
    'instructor': 5,
    'admin': 10,
};
exports.ROLE_HIERARCHY = ROLE_HIERARCHY;
// Permission Matrix - Define what each role can do to each resource
const PERMISSION_MATRIX = {
    'courses': {
        'read': ['user', 'instructor', 'admin'],
        'create': ['instructor', 'admin'],
        'update': ['instructor', 'admin'],
        'delete': ['admin'],
        'publish': ['instructor', 'admin'],
        'archive': ['admin']
    },
    'users': {
        'read': ['admin'],
        'create': ['admin'],
        'update': ['admin'],
        'delete': ['admin'],
        'promote': ['admin']
    },
    'lessons': {
        'read': ['user', 'instructor', 'admin'],
        'create': ['instructor', 'admin'],
        'update': ['instructor', 'admin'],
        'delete': ['instructor', 'admin']
    },
    'reports': {
        'read': ['admin'],
        'generate': ['admin'],
        'export': ['admin']
    },
    'reviews': {
        'read': ['user', 'instructor', 'admin'],
        'create': ['user', 'instructor', 'admin'],
        'update': ['admin'], // Only admins can edit reviews
        'delete': ['admin']
    }
};
exports.PERMISSION_MATRIX = PERMISSION_MATRIX;
// Permission cache to avoid repeated calculations
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
/**
 * Enterprise permission checker with TRUE resource-action enforcement
 * @param userRoles - User's assigned roles
 * @param resource - Resource being accessed (e.g., 'courses', 'users')
 * @param action - Action being performed (e.g., 'read', 'write', 'delete')
 * @param options - Permission check options
 */
const hasResourcePermission = (userRoles, resource, action, options = {}) => {
    const { hierarchical = true } = options;
    if (!userRoles?.length)
        return false;
    // ✅ TRUE RESOURCE-ACTION CHECKING STARTS HERE
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
        const userMaxLevel = Math.max(...userRoles.map(role => ROLE_HIERARCHY[role] || 0));
        // Get minimum required level for this resource-action
        const requiredMinLevel = Math.min(...allowedRoles.map(role => ROLE_HIERARCHY[role] || Infinity));
        return userMaxLevel >= requiredMinLevel;
    }
    else {
        // Non-hierarchical: exact role matching
        return allowedRoles.some(role => userRoles.includes(role));
    }
};
exports.hasResourcePermission = hasResourcePermission;
/**
 * Legacy role-only permission checker (for backward compatibility)
 * @param userRoles - User's assigned roles
 * @param requiredRoles - Required roles for access
 * @param options - Permission check options
 */
const hasPermission = (userRoles, requiredRoles, options = {}) => {
    const { requireAll = false, hierarchical = true } = options;
    if (!userRoles?.length)
        return false;
    if (hierarchical) {
        // Get highest user role level
        const userMaxLevel = Math.max(...userRoles.map(role => ROLE_HIERARCHY[role] || 0));
        // Get required minimum level
        const requiredMinLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role] || Infinity));
        return userMaxLevel >= requiredMinLevel;
    }
    // Non-hierarchical: exact role matching
    if (requireAll) {
        return requiredRoles.every(role => userRoles.includes(role));
    }
    else {
        return requiredRoles.some(role => userRoles.includes(role));
    }
};
exports.hasPermission = hasPermission;
/**
 * Generates cache key for permission check
 */
const getCacheKey = (userId, roles, resource, action) => {
    return `perm:${userId}:${roles.join(',')}:${resource || 'any'}:${action || 'any'}`;
};
exports.protect = (0, catchAsync_1.default)(async (req, res, next) => {
    // 1) Get token from headers or cookies
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new appError_1.default('You are not logged in! Please log in to get access.', 401));
    }
    try {
        // 2) Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // 3) Check if user still exists
        const currentUser = await userModel_1.User.findById(decoded.id);
        if (!currentUser) {
            return next(new appError_1.default('The user belonging to this token does not exist.', 401));
        }
        // 4) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new appError_1.default('User recently changed password! Please log in again.', 401));
        }
        // 5) Grant access to protected route
        req.user = currentUser;
        next();
    }
    catch (error) {
        return next(new appError_1.default('Invalid token. Please log in again.', 401));
    }
});
/**
 * Role restriction middleware with caching and hierarchy
 * @param roles - Required roles for access
 * @param options - Permission configuration options
 */
const restrictTo = (roles, options = {}) => {
    return (req, res, next) => {
        // Early validation
        if (!req.user) {
            return next(new appError_1.default('Authentication required', 401));
        }
        if (!req.user.role || !Array.isArray(req.user.role)) {
            return next(new appError_1.default('User role information invalid', 403));
        }
        if (!roles.length) {
            return next(new appError_1.default('No roles specified for access control', 500));
        }
        const userId = req.user._id?.toString();
        const userRoles = req.user.role;
        // Check cache first (enterprise optimization)
        const cacheKey = getCacheKey(userId, roles, options.resource, options.action);
        const cachedResult = permissionCache.get(cacheKey);
        if (cachedResult !== undefined) {
            if (!cachedResult) {
                return next(new appError_1.default('Insufficient permissions', 403));
            }
            return next();
        }
        // ✅ TRUE RESOURCE-ACTION PERMISSION CHECK
        let isPermitted;
        if (options.resource && options.action) {
            // Use resource-action based permission checking
            isPermitted = hasResourcePermission(userRoles, options.resource, options.action, options);
            // Log detailed permission check for enterprise auditing
            console.log(`Permission Check: User ${userId} with roles [${userRoles.join(',')}] attempting '${options.action}' on '${options.resource}' -> ${isPermitted ? 'ALLOWED' : 'DENIED'}`);
        }
        else {
            // Fallback to legacy role-only checking
            isPermitted = hasPermission(userRoles, roles, options);
            console.log(`Legacy Permission Check: User ${userId} with roles [${userRoles.join(',')}] checking roles [${roles.join(',')}] -> ${isPermitted ? 'ALLOWED' : 'DENIED'}`);
        }
        // Cache result for performance (with TTL)
        permissionCache.set(cacheKey, isPermitted);
        setTimeout(() => permissionCache.delete(cacheKey), CACHE_TTL);
        if (!isPermitted) {
            // Log unauthorized access attempt (enterprise security)
            console.warn(`Unauthorized access attempt: User ${userId} with roles [${userRoles.join(',')}] tried to access resource requiring [${roles.join(',')}]`);
            return next(new appError_1.default('You do not have permission to perform this action!', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
/**
 * TRUE Resource-Action permission middleware
 * @param resource - Specific resource being accessed
 * @param action - Action being performed (read, write, delete, etc.)
 */
const requirePermission = (resource, action) => {
    return (req, res, next) => {
        // Early validation
        if (!req.user) {
            return next(new appError_1.default('Authentication required', 401));
        }
        if (!req.user.role || !Array.isArray(req.user.role)) {
            return next(new appError_1.default('User role information invalid', 403));
        }
        const userId = req.user._id?.toString();
        const userRoles = req.user.role;
        // Check cache first
        const cacheKey = getCacheKey(userId, [], resource, action);
        const cachedResult = permissionCache.get(cacheKey);
        if (cachedResult !== undefined) {
            if (!cachedResult) {
                return next(new appError_1.default(`Access denied: Cannot '${action}' on '${resource}'`, 403));
            }
            return next();
        }
        // ✅ ACTUAL RESOURCE-ACTION PERMISSION CHECK
        const isPermitted = hasResourcePermission(userRoles, resource, action, { hierarchical: true });
        // Cache result
        permissionCache.set(cacheKey, isPermitted);
        setTimeout(() => permissionCache.delete(cacheKey), CACHE_TTL);
        if (!isPermitted) {
            // Enterprise security logging
            console.warn(`🚫 UNAUTHORIZED ACCESS: User ${userId} with roles [${userRoles.join(',')}] attempted '${action}' on '${resource}' - BLOCKED`);
            return next(new appError_1.default(`Access denied: You cannot '${action}' on '${resource}'. Required roles: [${PERMISSION_MATRIX[resource]?.[action]?.join(', ') || 'undefined'}]`, 403));
        }
        // Success logging
        console.log(`✅ AUTHORIZED ACCESS: User ${userId} performing '${action}' on '${resource}'`);
        next();
    };
};
exports.requirePermission = requirePermission;
/**
 * Owner-based access control - user can access their own resources
 * @param roles - Fallback roles if not owner
 */
const requireOwnerOrRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new appError_1.default('Authentication required', 401));
        }
        const userId = req.user._id?.toString();
        const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
        // Allow if user is accessing their own resource
        if (userId === resourceUserId) {
            return next();
        }
        // Otherwise, check role permissions
        return (0, exports.restrictTo)(roles)(req, res, next);
    };
};
exports.requireOwnerOrRole = requireOwnerOrRole;
/**
 * Clears permission cache for a specific user (call on role changes)
 * @param userId - User ID to clear cache for
 */
const clearUserPermissionCache = (userId) => {
    for (const [key] of permissionCache) {
        if (key.includes(`perm:${userId}:`)) {
            permissionCache.delete(key);
        }
    }
};
exports.clearUserPermissionCache = clearUserPermissionCache;
//# sourceMappingURL=authMiddleware.js.map