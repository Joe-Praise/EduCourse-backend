import { Request, Response, NextFunction } from 'express';
/**
 * Strips ALL HTML from every string field in req.body.
 * Apply on routes that do not accept rich text (users, categories, modules,
 * lessons, tags, links, completed-courses, certificates).
 */
export declare const strictXssSanitizer: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=strictXssSanitizer.d.ts.map