import type { Request, Response, NextFunction } from 'express';
import '../events/cache/completedCourseCache.events.js';
export declare const getRegisteredCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const createCompletedCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAllCompletedCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAllActiveCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateActiveCourseLessons: (req: Request, res: Response, next: NextFunction) => void;
export declare const getProgressSummary: (req: Request, res: Response, next: NextFunction) => void;
export declare const getOneCompletedCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteCompletedCourse: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=completedCourseController.d.ts.map