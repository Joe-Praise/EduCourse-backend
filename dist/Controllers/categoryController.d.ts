import type { Request, Response, NextFunction } from 'express';
import '../events/cache/categoryCache.events.js';
/**
 * List categories. For COURSE categories (`?group=course`) only those that are
 * actually used by at least one PUBLISHED course are returned — empty
 * categories shouldn't clutter the courses filter / frontend. Blog + ungrouped
 * queries fall through to the standard behaviour. Mirrors the factory `getAll`
 * response shape.
 */
export declare const getAllCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMyLearningCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const createCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteCategory: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=categoryController.d.ts.map