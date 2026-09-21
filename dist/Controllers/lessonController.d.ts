import type { Request, Response, NextFunction } from 'express';
import '../events/cache/lessonCache.events.js';
export declare const createLesson: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAllLessons: (req: Request, res: Response, next: NextFunction) => void;
export declare const getLesson: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateLesson: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteLesson: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=lessonController.d.ts.map