import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { findDuplicateModuleIds } from '../../src/scripts/dedupeImportedModules.js';

const course = new Types.ObjectId();
const other = new Types.ObjectId();
const at = (minutes: number) => new Date(Date.UTC(2026, 9, 15, 10, minutes));
const mod = (courseId: Types.ObjectId, moduleIndex: number, title: string, minutes: number) => ({
  _id: new Types.ObjectId(), courseId, moduleIndex, title, createdAt: at(minutes),
});

describe('findDuplicateModuleIds', () => {
  it('keeps the earliest copy of each (course, index, title) and flags the rest', () => {
    const first = [mod(course, 1, 'Intro to Nx', 0), mod(course, 2, 'Integration', 0)];
    const replay = [mod(course, 1, 'Intro to Nx', 5), mod(course, 2, 'Integration', 5)];

    const ids = findDuplicateModuleIds([...replay, ...first]);

    expect(ids.map(String).sort()).toEqual(replay.map((m) => String(m._id)).sort());
  });

  it('leaves same-index modules with different titles alone', () => {
    expect(findDuplicateModuleIds([mod(course, 3, 'Testing', 0), mod(course, 3, 'Deploying', 1)])).toEqual([]);
  });

  it('never matches across courses', () => {
    expect(findDuplicateModuleIds([mod(course, 1, 'Intro', 0), mod(other, 1, 'Intro', 1)])).toEqual([]);
  });
});
