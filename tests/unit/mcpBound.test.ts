import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  boundModuleLessons,
  HARD_CEILING_CHARS,
  measure,
  TARGET_CHARS,
  toContent,
  truncateField,
} from '../../src/mcp/edcourseContent/bound.js';
import {
  CANONICAL_COURSE_ID,
  CANONICAL_LESSONS,
  CANONICAL_MODULE_INDEX,
  CANONICAL_MODULE_TITLE,
} from '../fixtures/edcourseCanonicalLessons.js';

const lessons = (n: number, body: string, title = 'Lesson') =>
  Array.from({ length: n }, (_, i) => ({ title: `${title} ${i + 1}`, description: body }));

function okText(result: ReturnType<typeof boundModuleLessons>): string {
  if (result.kind !== 'ok') throw new Error('expected ok');
  return result.text;
}

describe('truncateField', () => {
  it('leaves short values untouched', () => {
    expect(truncateField('hello', 10)).toBe('hello');
  });

  it('caps long values and reports the removed count', () => {
    const out = truncateField('x'.repeat(5000), 2000);
    expect(Array.from(out).length).toBeLessThanOrEqual(2000);
    const removed = Number(/…\[truncated (\d+) chars\]$/.exec(out)?.[1]);
    expect(Array.from(out).length - `…[truncated ${removed} chars]`.length + removed).toBe(5000);
  });

  it('never splits a surrogate pair', () => {
    const out = truncateField('😀'.repeat(100), 40);
    expect(out).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  it('keeps a visible marker even at cap 0', () => {
    expect(truncateField('abc', 0)).toBe('…[truncated 3 chars]');
    expect(truncateField('', 0)).toBe('');
  });
});

describe('boundModuleLessons', () => {
  it('returns a normal module untouched and within target', () => {
    const r = boundModuleLessons('c1', 1, 'Intro', lessons(3, 'Short body.'));
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.truncated).toBe(false);
    expect(r.size).toBeLessThanOrEqual(TARGET_CHARS);
    expect(JSON.parse(r.text)).toEqual({
      courseId: 'c1',
      moduleIndex: 1,
      moduleTitle: 'Intro',
      lessons: [1, 2, 3].map((i) => ({ title: `Lesson ${i}`, body: 'Short body.' })),
    });
  });

  it('bounds one enormous body and marks it', () => {
    const r = boundModuleLessons('c1', 1, 'Intro', lessons(1, 'y'.repeat(1_000_000)));
    const text = okText(r);
    expect(measure(text)).toBeLessThanOrEqual(TARGET_CHARS);
    expect(JSON.parse(text).lessons[0].body).toMatch(/…\[truncated \d+ chars\]$/);
  });

  it('shrinks bodies across many lessons, keeping every lesson in order', () => {
    const text = okText(boundModuleLessons('c1', 2, 'M', lessons(20, 'z'.repeat(3000))));
    const parsed = JSON.parse(text);
    expect(parsed.lessons).toHaveLength(20);
    expect(parsed.lessons.map((l: { title: string }) => l.title)).toEqual(
      Array.from({ length: 20 }, (_, i) => `Lesson ${i + 1}`),
    );
    expect(measure(text)).toBeLessThanOrEqual(TARGET_CHARS);
  });

  it.each([
    ['quotes', '"'],
    ['backslashes', '\\'],
    ['control chars', '\u0000'],
    ['newlines', '\n'],
    ['emoji', '😀'],
  ])('stays under the hard ceiling with adversarial %s, or refuses', (_l, ch) => {
    for (const n of [1, 10, 25, 50]) {
      const r = boundModuleLessons(
        'c1',
        1,
        ch.repeat(500),
        lessons(n, ch.repeat(5000), ch.repeat(500)),
      );
      if (r.kind === 'ok') {
        expect(r.size).toBeLessThanOrEqual(HARD_CEILING_CHARS);
        expect(measure(r.text)).toBe(r.size);
        expect(() => JSON.parse(r.text)).not.toThrow();
        expect(JSON.parse(r.text).lessons).toHaveLength(n);
      } else {
        expect(r.kind).toBe('too_large');
      }
    }
  });

  it('projects only contract fields even if the source carries more', () => {
    const raw = [{ title: 't', description: 'd', url: 'https://x', _id: 'id', email: 'a@b.c' }];
    const parsed = JSON.parse(okText(boundModuleLessons('c1', 1, 'M', raw)));
    expect(Object.keys(parsed).sort()).toEqual(['courseId', 'lessons', 'moduleIndex', 'moduleTitle']);
    expect(Object.keys(parsed.lessons[0]).sort()).toEqual(['body', 'title']);
  });

  it('maps missing or non-string fields to empty strings', () => {
    const parsed = JSON.parse(okText(boundModuleLessons('c1', 1, 'M', [{}, { title: 5, description: null }])));
    expect(parsed.lessons).toEqual([
      { title: '', body: '' },
      { title: '', body: '' },
    ]);
  });
});

// Succor normalizes a tool result as JSON.stringify(result.content) and caps that
// string at 8,000 chars (agent-service tool-execution.ts MAX_TOOL_RESULT_CHARS).
const SUCCOR_RESULT_CAP = 8_000;
const MARKER = /…\[truncated \d+ chars\]/;
const canonicalRaw = () => CANONICAL_LESSONS.map((l) => ({ title: l.title, description: l.description }));

describe('content target (4I.60)', () => {
  it('targets 6,500 chars under an unchanged 8,000 hard ceiling', () => {
    expect(TARGET_CHARS).toBe(6_500);
    expect(HARD_CEILING_CHARS).toBe(8_000);
    expect(HARD_CEILING_CHARS).toBeLessThanOrEqual(SUCCOR_RESULT_CAP);
  });

  it('uses the verbatim 4I.59 canonical descriptions', () => {
    expect(CANONICAL_LESSONS.map((l) => l.sha256)).toEqual([
      '2ea087a2d950c7d641bbd274cc1f6bbd8ca79d0ba268f49c4167528c7455dfa3',
      '960f4615be71e2e272660d1b72b0486af66494bb5368eaca246f011d7bc1e45f',
      '0858197c2d4802b2e05f5d7edebf0ec1f5fdea587b7dbbac7e2c7eca07fca10a',
    ]);
    for (const l of CANONICAL_LESSONS) {
      expect(createHash('sha256').update(l.description, 'utf8').digest('hex')).toBe(l.sha256);
    }
  });

  describe('System Design Mastery Module 1 with its canonical descriptions', () => {
    const result = () =>
      boundModuleLessons(CANONICAL_COURSE_ID, CANONICAL_MODULE_INDEX, CANONICAL_MODULE_TITLE, canonicalRaw());

    it('returns every description whole, unmodified, with no truncation marker', () => {
      const r = result();
      expect(r.kind).toBe('ok');
      if (r.kind !== 'ok') return;
      expect(r.truncated).toBe(false);
      expect(r.text).not.toMatch(MARKER);
      expect(JSON.parse(r.text).lessons.map((l: { body: string }) => l.body)).toEqual(
        CANONICAL_LESSONS.map((l) => l.description),
      );
    });

    it('keeps lesson order, lesson titles and module context unchanged', () => {
      const parsed = JSON.parse(okText(result()));
      expect(parsed.courseId).toBe(CANONICAL_COURSE_ID);
      expect(parsed.moduleIndex).toBe(CANONICAL_MODULE_INDEX);
      expect(parsed.moduleTitle).toBe(CANONICAL_MODULE_TITLE);
      expect(parsed.lessons.map((l: { title: string }) => l.title)).toEqual(CANONICAL_LESSONS.map((l) => l.title));
    });

    it('fits the 6,500 target but not the former 6,000 one (the regression this fixes)', () => {
      const r = result();
      if (r.kind !== 'ok') throw new Error('expected ok');
      expect(r.size).toBeLessThanOrEqual(TARGET_CHARS);
      expect(r.size).toBeGreaterThan(6_000);
    });

    it("stays under Succor's 8,000-char cap, measured exactly as Succor measures it", () => {
      const r = result();
      if (r.kind !== 'ok') throw new Error('expected ok');
      const normalized = JSON.stringify(toContent(r.text));
      expect(normalized.length).toBe(r.size);
      expect(normalized.length).toBeLessThan(SUCCOR_RESULT_CAP);
    });
  });

  it('still truncates visibly, as exact prefixes, once a module exceeds the target', () => {
    const raw = [...canonicalRaw(), { title: 'Fourth lesson', description: CANONICAL_LESSONS[0].description }];
    const r = boundModuleLessons(CANONICAL_COURSE_ID, CANONICAL_MODULE_INDEX, CANONICAL_MODULE_TITLE, raw);
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.truncated).toBe(true);
    expect(r.size).toBeLessThanOrEqual(TARGET_CHARS);
    const parsed = JSON.parse(r.text);
    expect(parsed.lessons.map((l: { title: string }) => l.title)).toEqual(raw.map((l) => l.title));
    let marked = 0;
    parsed.lessons.forEach((l: { body: string }, i: number) => {
      const m = MARKER.exec(l.body);
      if (!m) return expect(l.body).toBe(raw[i].description);
      marked += 1;
      expect(raw[i].description.startsWith(l.body.slice(0, m.index))).toBe(true);
    });
    expect(marked).toBeGreaterThan(0);
  });
});
