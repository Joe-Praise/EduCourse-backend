import type { RawLesson } from './contentAccess.js';

/**
 * Projection + deterministic response bounding.
 *
 * Size is measured the way agent-service measures it: JSON.stringify of the
 * whole MCP `content` array, so the payload JSON is escaped twice. The target
 * is 6,000 chars; the hard ceiling (agent-service's own) is 8,000.
 *
 * Strategy: cap every string field, then step down a fixed ladder (bodies
 * first, then lesson titles) until the target fits. Lessons are never dropped.
 * If even the last step exceeds the hard ceiling the caller gets an error
 * instead of a silently shortened module.
 */

export const TARGET_CHARS = 6_000;
export const HARD_CEILING_CHARS = 8_000;
export const MODULE_TITLE_CAP = 200;

const LADDER: ReadonlyArray<{ title: number; body: number }> = [
  { title: 200, body: 2000 },
  { title: 200, body: 1500 },
  { title: 200, body: 1000 },
  { title: 200, body: 600 },
  { title: 200, body: 300 },
  { title: 200, body: 150 },
  { title: 200, body: 80 },
  { title: 200, body: 0 },
  { title: 120, body: 0 },
  { title: 80, body: 0 },
  { title: 40, body: 0 },
];

export interface ModuleLessonsPayload {
  courseId: string;
  moduleIndex: number;
  moduleTitle: string;
  lessons: { title: string; body: string }[];
}

export type BoundResult =
  | { kind: 'ok'; text: string; size: number; truncated: boolean }
  | { kind: 'too_large' };

const truncationMarker = (removed: number) => `…[truncated ${removed} chars]`;

/**
 * Cap a string at `cap` code points (never splitting a surrogate pair), with a
 * visible marker counting what was removed. The marker is always kept, even
 * when it alone exceeds the cap.
 */
export function truncateField(value: string, cap: number): string {
  const chars = Array.from(value);
  if (chars.length <= cap) return value;
  let keep = Math.max(0, cap - truncationMarker(chars.length).length);
  // The marker's digit count depends on `removed`; one more pass settles it.
  keep = Math.max(0, cap - truncationMarker(chars.length - keep).length);
  return chars.slice(0, keep).join('') + truncationMarker(chars.length - keep);
}

const asText = (v: unknown): string => (typeof v === 'string' ? v : '');

/** The exact wire form the tool returns, and the length agent-service measures. */
export function toContent(text: string): [{ type: 'text'; text: string }] {
  return [{ type: 'text', text }];
}

export const measure = (text: string): number => JSON.stringify(toContent(text)).length;

export function boundModuleLessons(
  courseId: string,
  moduleIndex: number,
  moduleTitle: string,
  rawLessons: RawLesson[],
): BoundResult {
  // Projection: only the contract fields, from the only source fields.
  const lessons = rawLessons.map((l) => ({ title: asText(l.title), body: asText(l.description) }));

  let last: { text: string; size: number; truncated: boolean } | null = null;
  for (const step of LADDER) {
    const payload: ModuleLessonsPayload = {
      courseId,
      moduleIndex,
      moduleTitle: truncateField(moduleTitle, MODULE_TITLE_CAP),
      lessons: lessons.map((l) => ({
        title: truncateField(l.title, step.title),
        body: truncateField(l.body, step.body),
      })),
    };
    const text = JSON.stringify(payload);
    const truncated =
      payload.moduleTitle !== moduleTitle ||
      payload.lessons.some((l, i) => l.title !== lessons[i].title || l.body !== lessons[i].body);
    last = { text, size: measure(text), truncated };
    if (last.size <= TARGET_CHARS) return { kind: 'ok', ...last };
  }

  if (last && last.size <= HARD_CEILING_CHARS) return { kind: 'ok', ...last };
  return { kind: 'too_large' };
}
