import type { Request, Response, NextFunction } from 'express';
import '../events/cache/instructorCache.events.js';
export declare const createInstructor: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateMe: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteMe: (req: Request, res: Response, next: NextFunction) => void;
/**
 * List instructors — but ONLY those who appear on at least one PUBLISHED
 * course. Avoids showing empty/draft instructors (and YouTube instructors whose
 * import failed) on the public instructors page. Mirrors the factory `getAll`
 * shape (APIFeatures + Pagination + metaData envelope).
 */
export declare const getAllInstructors: (req: Request, res: Response, next: NextFunction) => void;
export declare const getOneInstructor: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMyLearningInstructors: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateInstructor: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteInstructor: (req: Request, res: Response, next: NextFunction) => void;
export declare const suspendInstructor: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=instructorController.d.ts.map