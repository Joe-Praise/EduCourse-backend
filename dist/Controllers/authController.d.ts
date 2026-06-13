import type { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, LoginRequest, SignupRequest, UpdatePasswordRequest } from '../utils/helper.js';
export declare const signup: (req: Request, res: Response, next: NextFunction) => void;
export declare const login: (req: Request, res: Response, next: NextFunction) => void;
export declare const updatePassword: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
export declare const resetPassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * POST /api/v1/users/refresh
 * Body-less. Reads the `rt` httpOnly cookie, validates + rotates the refresh
 * token, returns a fresh access JWT + sets a new refresh cookie.
 *
 * Rotation: every successful refresh REVOKES the submitted token and issues a
 * brand-new one. If a revoked token is later submitted, we treat the session
 * as compromised and revoke ALL refresh tokens for the user.
 */
export declare const refreshAccessToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * POST /api/v1/users/logout
 * Revokes the submitted refresh token (if any) and clears both cookies.
 * Idempotent — safe to call multiple times.
 */
export declare const logout: (req: Request, res: Response, next: NextFunction) => void;
export type { AuthenticatedRequest, LoginRequest, SignupRequest, UpdatePasswordRequest, };
//# sourceMappingURL=authController.d.ts.map