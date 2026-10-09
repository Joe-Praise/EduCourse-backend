import { Types } from 'mongoose';
import { Course } from '../../models/courseModel.js';
import { CourseModule } from '../../models/courseModuleModel.js';
import { Lesson } from '../../models/lessonModel.js';

/**
 * The only database access in the MCP path. Reads only — no writes, no cache
 * mutation, no raw driver.
 *
 * Content boundary: this deployment's database is EdCourse (single-tenant), so
 * the tenant is never selectable by the caller. Within it, a course is readable
 * only when published and not soft-deleted; modules and lessons must be active
 * and bound to that course.
 *
 * The models' pre-find hooks populate instructors/category (Course) and every
 * lesson (Module), so this path uses explicit-filter reads that avoid them.
 */

/** Hard bound on lessons read for one module; more than this is refused, never silently dropped. */
export const MAX_LESSONS = 50;

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export interface RawLesson {
  title?: unknown;
  description?: unknown;
}

export type ModuleLessonsRead =
  | { kind: 'ok'; moduleTitle: string; lessons: RawLesson[] }
  | { kind: 'course_not_found' }
  | { kind: 'module_not_found' }
  | { kind: 'too_many_lessons' };

export async function readModuleLessons(
  courseId: string,
  moduleIndex: number,
): Promise<ModuleLessonsRead> {
  // Course ids are ObjectIds; anything else cannot exist, so skip the query.
  if (!OBJECT_ID_RE.test(courseId)) return { kind: 'course_not_found' };
  const courseOid = new Types.ObjectId(courseId);

  const courseCount = await Course.countDocuments({
    _id: courseOid,
    publishedStatus: 'published',
    active: { $ne: false },
  });
  if (courseCount !== 1) return { kind: 'course_not_found' };

  const [mod] = await CourseModule.aggregate<{ _id: Types.ObjectId; title?: unknown }>([
    { $match: { courseId: courseOid, moduleIndex, active: { $ne: false } } },
    { $sort: { _id: 1 } },
    { $limit: 1 },
    { $project: { _id: 1, title: 1 } },
  ]);
  if (!mod) return { kind: 'module_not_found' };

  const lessons = await Lesson.find({
    moduleId: mod._id,
    courseId: courseOid,
    active: { $ne: false },
  })
    .select({ _id: 0, title: 1, description: 1 })
    .sort({ lessonIndex: 1, _id: 1 })
    .limit(MAX_LESSONS + 1)
    .lean<RawLesson[]>();

  if (lessons.length > MAX_LESSONS) return { kind: 'too_many_lessons' };

  return {
    kind: 'ok',
    moduleTitle: typeof mod.title === 'string' ? mod.title : '',
    lessons,
  };
}
