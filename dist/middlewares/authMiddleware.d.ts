import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../Controllers/authController';
import { RoleType } from '../utils/constants';
/**
 * Role-Based Access Control (RBAC) System with True Resource-Action Enforcement
 * Implements hierarchical permissions with granular resource-action control
 */
declare const ROLE_HIERARCHY: Record<RoleType, number>;
declare const PERMISSION_MATRIX: Record<string, Record<string, RoleType[]>>;
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
export declare const protect: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * Role restriction middleware with caching and hierarchy
 * @param roles - Required roles for access
 * @param options - Permission configuration options
 */
export declare const restrictTo: (roles: RoleType[], options?: PermissionOptions) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * TRUE Resource-Action permission middleware
 * @param resource - Specific resource being accessed
 * @param action - Action being performed (read, write, delete, etc.)
 */
export declare const requirePermission: (resource: string, action: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Owner-based access control - user can access their own resources
 * @param roles - Fallback roles if not owner
 */
export declare const requireOwnerOrRole: (roles: RoleType[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Clears permission cache for a specific user (call on role changes)
 * @param userId - User ID to clear cache for
 */
export declare const clearUserPermissionCache: (userId: string) => void;
export { hasPermission, hasResourcePermission, ROLE_HIERARCHY, PERMISSION_MATRIX };
export type { PermissionOptions };
//# sourceMappingURL=authMiddleware.d.ts.map