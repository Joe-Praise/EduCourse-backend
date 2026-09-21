import type { Request, Response, NextFunction } from 'express';
import '../events/cache/courseCache.events.js';
export declare const atlasAutocomplete: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAllCourses: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const getLectureCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMyLearningCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const searchMyLearningCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const createCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const resizePhoto: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadResources: (req: Request, res: Response, next: NextFunction) => void;
export declare const submitForReview: (req: Request, res: Response, next: NextFunction) => void;
export declare const publishCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const archiveCourse: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=courseController.d.ts.map