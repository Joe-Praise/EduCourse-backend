/**
 * The ratified contract for the `edcourse-content` MCP server (4I.20 / 4I.21E).
 * One server, one tool. The input schema is advertised verbatim — do not
 * weaken it, add fields, or make anything optional.
 */

export const SERVER_NAME = 'edcourse-content';
export const SERVER_VERSION = '1.0.0';
export const TOOL_NAME = 'get_module_lessons';

export const TOOL_DESCRIPTION =
  'Read-only. Returns the title and body of every lesson in one module of one EdCourse course.';

const COURSE_ID_PATTERN = '^[A-Za-z0-9_-]+$';

export const INPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: Object.freeze({
    courseId: Object.freeze({
      type: 'string',
      minLength: 1,
      maxLength: 64,
      pattern: COURSE_ID_PATTERN,
    }),
    moduleIndex: Object.freeze({
      type: 'integer',
      minimum: 0,
      maximum: 50,
    }),
  }),
  required: Object.freeze(['courseId', 'moduleIndex']),
  additionalProperties: false,
});

export interface ModuleLessonsInput {
  courseId: string;
  moduleIndex: number;
}

const ALLOWED_KEYS = new Set(['courseId', 'moduleIndex']);
const COURSE_ID_RE = new RegExp(COURSE_ID_PATTERN);

/**
 * Strict validation against INPUT_SCHEMA. No coercion, no trimming, no repair:
 * anything that is not exactly valid is rejected.
 */
export function validateInput(args: unknown): ModuleLessonsInput | null {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) return null;
  const proto = Object.getPrototypeOf(args);
  if (proto !== Object.prototype && proto !== null) return null;

  const keys = Object.keys(args);
  if (keys.length !== ALLOWED_KEYS.size || !keys.every((k) => ALLOWED_KEYS.has(k))) return null;

  const { courseId, moduleIndex } = args as Record<string, unknown>;

  if (
    typeof courseId !== 'string' ||
    courseId.length < 1 ||
    courseId.length > 64 ||
    !COURSE_ID_RE.test(courseId)
  ) {
    return null;
  }

  if (
    typeof moduleIndex !== 'number' ||
    !Number.isInteger(moduleIndex) ||
    moduleIndex < 0 ||
    moduleIndex > 50
  ) {
    return null;
  }

  return { courseId, moduleIndex };
}
