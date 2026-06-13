import type { Request, Response, NextFunction } from 'express';
import '../events/cache/linkCache.events.js';
export declare const createLink: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAllLinks: (req: Request, res: Response, next: NextFunction) => void;
export declare const getLink: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateLink: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteLink: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=linkController.d.ts.map