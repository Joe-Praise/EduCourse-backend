import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authController.js';
import '../events/cache/userCache.events.js';
export declare const uploadUserPhoto: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const resizePhoto: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMe: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const updateMe: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteMe: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAllUsers: (req: Request, res: Response, next: NextFunction) => void;
export declare const getUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const getProfile: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteUser: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=userController.d.ts.map