import { Request, Response, NextFunction } from 'express';
/**
 * Factory middleware that applies permissive (rich-text-safe) HTML sanitization
 * to the specified fields in req.body. Apply on routes that accept rich text
 * (blog description, instructor bio, review text, blog comment text, course description).
 *
 * @param fields - Array of req.body field names to sanitize with rich text rules
 */
export declare const sanitizeRichText: (fields: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=richTextSanitizer.d.ts.map