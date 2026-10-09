import crypto from 'crypto';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../utils/logger.js';
import { TOOL_NAME, validateInput } from './contract.js';
import { readModuleLessons } from './contentAccess.js';
import { boundModuleLessons, toContent } from './bound.js';

/**
 * `get_module_lessons`: validate → tenant-scoped read → project + bound.
 * Lesson text is returned as inert data — never parsed, rendered, evaluated or
 * followed. Errors are stable codes; input values and DB errors are never echoed.
 */

export type ToolErrorCode =
  | 'INVALID_INPUT'
  | 'COURSE_NOT_FOUND'
  | 'MODULE_NOT_FOUND'
  | 'RESULT_TOO_LARGE'
  | 'CONTENT_UNAVAILABLE';

const ERROR_MESSAGES: Record<ToolErrorCode, string> = {
  INVALID_INPUT:
    'Arguments must be exactly { courseId: string matching ^[A-Za-z0-9_-]+$ (1-64 chars), moduleIndex: integer 0-50 }.',
  COURSE_NOT_FOUND: 'Course not found.',
  MODULE_NOT_FOUND: 'Module not found for this course.',
  RESULT_TOO_LARGE: 'Module content exceeds the maximum response size.',
  CONTENT_UNAVAILABLE: 'Course content is temporarily unavailable.',
};

export interface ToolDeps {
  read: typeof readModuleLessons;
}

const defaultDeps: ToolDeps = { read: readModuleLessons };

function errorResult(code: ToolErrorCode): CallToolResult {
  return {
    isError: true,
    content: toContent(JSON.stringify({ error: { code, message: ERROR_MESSAGES[code] } })),
  };
}

export async function getModuleLessons(
  args: unknown,
  deps: ToolDeps = defaultDeps,
): Promise<CallToolResult> {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const log = (outcome: string, extra: Record<string, unknown> = {}) => ({
    requestId,
    tool: TOOL_NAME,
    outcome,
    durationMs: Date.now() - started,
    ...extra,
  });

  const input = validateInput(args);
  if (!input) {
    logger.warn('[mcp:edcourse-content]', log('INVALID_INPUT'));
    return errorResult('INVALID_INPUT');
  }
  const { courseId, moduleIndex } = input;

  let read: Awaited<ReturnType<ToolDeps['read']>>;
  try {
    read = await deps.read(courseId, moduleIndex);
  } catch (err) {
    // Category only — never the driver message, which can carry hosts or query shapes.
    logger.error(
      '[mcp:edcourse-content]',
      log('CONTENT_UNAVAILABLE', {
        courseId,
        moduleIndex,
        errorCategory: err instanceof Error ? err.name : 'unknown',
      }),
    );
    return errorResult('CONTENT_UNAVAILABLE');
  }

  if (read.kind !== 'ok') {
    const code: ToolErrorCode =
      read.kind === 'course_not_found'
        ? 'COURSE_NOT_FOUND'
        : read.kind === 'module_not_found'
          ? 'MODULE_NOT_FOUND'
          : 'RESULT_TOO_LARGE';
    logger.warn('[mcp:edcourse-content]', log(code, { courseId, moduleIndex }));
    return errorResult(code);
  }

  const bounded = boundModuleLessons(courseId, moduleIndex, read.moduleTitle, read.lessons);
  if (bounded.kind !== 'ok') {
    logger.warn('[mcp:edcourse-content]', log('RESULT_TOO_LARGE', { courseId, moduleIndex }));
    return errorResult('RESULT_TOO_LARGE');
  }

  logger.info(
    '[mcp:edcourse-content]',
    log('ok', {
      courseId,
      moduleIndex,
      lessonCount: read.lessons.length,
      responseChars: bounded.size,
      truncated: bounded.truncated,
    }),
  );
  return { content: toContent(bounded.text) };
}
