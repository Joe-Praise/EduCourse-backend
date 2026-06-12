import sanitizeHtml from 'sanitize-html';
import { Request, Response, NextFunction } from 'express';

/**
 * Strips ALL HTML from every string field in req.body.
 * Apply on routes that do not accept rich text (users, categories, modules,
 * lessons, tags, links, completed-courses, certificates).
 */
export const strictXssSanitizer = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      obj[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeHtml(item, { allowedTags: [], allowedAttributes: {} })
          : item,
      );
    }
  }
}
