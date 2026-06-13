import sanitizeHtml from 'sanitize-html';
/**
 * Allowed HTML elements and attributes for rich text fields.
 * Strips dangerous tags (script, iframe, object, embed) and all on* event attributes.
 */
const RICH_TEXT_OPTIONS = {
    allowedTags: [
        'p', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4',
        'blockquote', 'code', 'pre',
        'a', 'br', 'span',
    ],
    allowedAttributes: {
        'a': ['href', 'target', 'rel'],
        'span': ['class'],
        'p': ['class'],
        'h1': ['class'],
        'h2': ['class'],
        'h3': ['class'],
        'h4': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Strip disallowed tags entirely (don't keep inner text for script/iframe)
    disallowedTagsMode: 'discard',
};
/**
 * Factory middleware that applies permissive (rich-text-safe) HTML sanitization
 * to the specified fields in req.body. Apply on routes that accept rich text
 * (blog description, instructor bio, review text, blog comment text, course description).
 *
 * @param fields - Array of req.body field names to sanitize with rich text rules
 */
export const sanitizeRichText = (fields) => {
    return (req, _res, next) => {
        if (req.body && typeof req.body === 'object') {
            for (const field of fields) {
                if (typeof req.body[field] === 'string') {
                    req.body[field] = sanitizeHtml(req.body[field], RICH_TEXT_OPTIONS);
                }
            }
        }
        next();
    };
};
//# sourceMappingURL=richTextSanitizer.js.map