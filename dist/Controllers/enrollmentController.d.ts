import type { Request, Response, NextFunction } from 'express';
import '../events/cache/enrollmentCache.events.js';
import '../events/cache/instructorEarningCache.events.js';
import '../events/cache/notificationCache.events.js';
export declare const createEnrollment: (req: Request, res: Response, next: NextFunction) => void;
export declare const getEnrollmentsByUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const getEnrollmentsByCourse: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkEnrollment: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteEnrollment: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=enrollmentController.d.ts.map