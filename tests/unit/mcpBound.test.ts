import { describe, it, expect } from 'vitest';
import {
  boundModuleLessons,
  HARD_CEILING_CHARS,
  measure,
  TARGET_CHARS,
  truncateField,
} from '../../src/mcp/edcourseContent/bound.js';

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
