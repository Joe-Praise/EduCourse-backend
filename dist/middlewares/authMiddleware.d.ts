import { NextFunction, Response, Request } from 'express';
import { PERMISSION_MATRIX, RoleType } from '../utils/constants.js';
export declare const protect: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Role-Based Access Control (RBAC) System with True Resource-Action Enforcement
 * Implements hierarchical permissions with granular resource-action control
 */
declare const ROLE_HIERARCHY: Record<RoleType, number>;
interface PermissionOptions {
    requireAll?: boolean;
    hierarchical?: boolean;
    resource?: string;
    action?: string;
}
/**
 * Enterprise permission checker with TRUE resource-action enforcement
 * @param userRoles - User's assigned roles
 * @param resource - Resource being accessed (e.g., 'courses', 'users')
 * @param action - Action being performed (e.g., 'read', 'write', 'delete')
 * @param options - Permission check options
 */
declare const hasResourcePermission: (userRoles: RoleType[], resource: string, action: string, options?: PermissionOptions) => boolean;
/**
 * Legacy role-only permission checker (for backward compatibility)
 * @param userRoles - User's assigned roles
 * @param requiredRoles - Required roles for access
 * @param options - Permission check options
 */
declare const hasPermission: (userRoles: RoleType[], requiredRoles: RoleType[], options?: PermissionOptions) => boolean;
/**
 * Role restriction middleware with caching and hierarchy
 * @param roles - Required roles for access
 * @param options - Permission configuration options
 */
export declare const restrictTo: (roles: RoleType[], options?: PermissionOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * TRUE Resource-Action permission middleware
 * @param resource - Specific resource being accessed
 * @param action - Action being performed (read, write, delete, etc.)
 */
export declare const requirePermission: (resource: string, action: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Owner-based access control - user can access their own resources
 * @param roles - Fallback roles if not owner
 */
export declare const requireOwnerOrRole: (roles: RoleType[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Clears permission cache for a specific user (call on role changes)
 * @param userId - User ID to clear cache for
 */
export declare const clearUserPermissionCache: (userId: string) => Promise<void>;
/**
 * Clears all permission cache (use for system maintenance)
 */
export declare const clearAllPermissionCache: () => Promise<void>;
/**
 * Get permission cache statistics
 */
export declare const getPermissionCacheStats: () => Promise<{
    totalKeys: number;
    keysByUser: Record<string, number>;
}>;
export { hasPermission, hasResourcePermission, ROLE_HIERARCHY, PERMISSION_MATRIX };
export type { PermissionOptions };
//# sourceMappingURL=authMiddleware.d.ts.map