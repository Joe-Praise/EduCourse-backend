import type { Response, NextFunction } from 'express';
import { AuthenticatedRequest, LoginRequest, SignupRequest, UpdatePasswordRequest } from '../utils/helper';
export declare const signup: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const login: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const updatePassword: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const checkToken: (req: import("express").Request, res: Response, next: NextFunction) => void;
export type { AuthenticatedRequest, LoginRequest, SignupRequest, UpdatePasswordRequest, };
//# sourceMappingURL=authController.d.ts.map