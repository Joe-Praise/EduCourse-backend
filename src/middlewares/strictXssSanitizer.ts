import sanitizeHtml from 'sanitize-html';
import { Request, Response, NextFunction } from 'express';
import { richTextToPlainText, stripExecutableMarkup } from '../utils/plainText.js';

/** Top-level string fields handled differently from the strip-all-HTML default. */
export interface StrictXssSanitizerOptions {
  /** Editor HTML stored as readable plain text (e.g. lesson descriptions). */
  richText?: readonly string[];
  /** Plain text kept as typed, minus executable markup (e.g. titles). */
  plainText?: readonly string[];
}

/**
 * Strips ALL HTML from every string field in req.body, except the top-level
 * fields named in `options`. Apply on routes that do not accept rich text
 * (users, categories, modules, lessons, tags, links, completed-courses,
 * certificates).
 */
export const createStrictXssSanitizer = (options: StrictXssSanitizerOptions = {}) => {
  const richText = new Set(options.richText);
  const plainText = new Set(options.plainText);

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      const handled = new Set<string>();
      for (const [key, value] of Object.entries(req.body as Record<string, unknown>)) {
        if (typeof value !== 'string') continue;
        if (richText.has(key)) req.body[key] = richTextToPlainText(value);
        else if (plainText.has(key)) req.body[key] = stripExecutableMarkup(value);
        else continue;
        handled.add(key);
      }
      sanitizeObject(req.body, handled);
    }
    next();
  };
};

export const strictXssSanitizer = createStrictXssSanitizer();

function sanitizeObject(obj: Record<string, unknown>, skip: ReadonlySet<string> = new Set()): void {
  for (const key of Object.keys(obj)) {
    if (skip.has(key)) continue;
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
