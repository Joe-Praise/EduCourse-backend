import { describe, it, expect } from 'vitest';
import { INPUT_SCHEMA, SERVER_NAME, TOOL_NAME, validateInput } from '../../src/mcp/edcourseContent/contract.js';

const RATIFIED_SCHEMA = {
  type: 'object',
  properties: {
    courseId: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[A-Za-z0-9_-]+$' },
    moduleIndex: { type: 'integer', minimum: 0, maximum: 50 },
  },
  required: ['courseId', 'moduleIndex'],
  additionalProperties: false,
};

describe('edcourse-content contract', () => {
  it('names the server and the single tool exactly', () => {
    expect(SERVER_NAME).toBe('edcourse-content');
    expect(TOOL_NAME).toBe('get_module_lessons');
  });

  it('advertises the ratified input schema verbatim', () => {
    expect(JSON.parse(JSON.stringify(INPUT_SCHEMA))).toStrictEqual(RATIFIED_SCHEMA);
  });

  it('accepts the canonical valid input and the boundaries', () => {
    expect(validateInput({ courseId: 'course_123', moduleIndex: 1 })).toEqual({
      courseId: 'course_123',
      moduleIndex: 1,
    });
    expect(validateInput({ courseId: 'c', moduleIndex: 0 })).not.toBeNull();
    expect(validateInput({ courseId: 'a'.repeat(64), moduleIndex: 50 })).not.toBeNull();
  });

  it.each([
    ['extra property', { courseId: 'course_123', moduleIndex: 1, extra: 'no' }],
    ['projectId cannot select a tenant', { courseId: 'course_123', moduleIndex: 1, projectId: 'other' }],
    ['missing moduleIndex', { courseId: 'course_123' }],
    ['missing courseId', { moduleIndex: 1 }],
    ['string moduleIndex', { courseId: 'course_123', moduleIndex: '1' }],
    ['fractional moduleIndex', { courseId: 'course_123', moduleIndex: 1.5 }],
    ['negative moduleIndex', { courseId: 'course_123', moduleIndex: -1 }],
    ['moduleIndex > 50', { courseId: 'c', moduleIndex: 51 }],
    ['NaN moduleIndex', { courseId: 'c', moduleIndex: NaN }],
    ['Infinity moduleIndex', { courseId: 'c', moduleIndex: Infinity }],
    ['empty courseId', { courseId: '', moduleIndex: 1 }],
    ['overlong courseId', { courseId: 'a'.repeat(65), moduleIndex: 1 }],
    ['path traversal courseId', { courseId: '../../etc/passwd', moduleIndex: 1 }],
    ['whitespace is not trimmed', { courseId: ' course_123', moduleIndex: 1 }],
    ['operator object courseId', { courseId: { $ne: null }, moduleIndex: 1 }],
    ['numeric courseId', { courseId: 123, moduleIndex: 1 }],
    ['null', null],
    ['array', [{ courseId: 'c', moduleIndex: 1 }]],
    ['string', '{"courseId":"c","moduleIndex":1}'],
  ])('rejects %s', (_label, input) => {
    expect(validateInput(input)).toBeNull();
  });

  it('rejects a non-plain object even with valid-looking keys', () => {
    class Args {
      courseId = 'c';
      moduleIndex = 1;
    }
    expect(validateInput(new Args())).toBeNull();
  });
});
