/**
 * Remove duplicate module sets from YouTube-imported courses.
 *
 * Before the import callback was made idempotent, a re-delivered callback
 * appended a second copy of the whole curriculum to the same course. A module
 * is a duplicate when another active module of the same imported course
 * (`youtubePlaylistId` set) has the SAME moduleIndex AND the SAME title — the
 * earliest-created one is kept. Manually built courses are never touched.
 *
 * Duplicates and their lessons are SOFT-deleted (`active: false`), matching the
 * app's soft-delete convention. Progress that pointed at a duplicate lesson
 * stops counting toward that course.
 *
 * DRY RUN BY DEFAULT — it only lists what would change. Pass --apply to write:
 *
 *   npx tsx src/scripts/dedupeImportedModules.ts            # preview
 *   npx tsx src/scripts/dedupeImportedModules.ts --apply    # soft-delete
 *
 * Idempotent + safe to re-run. It connects to the DATABASE in config.env —
 * check which database that is before passing --apply.
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import mongoose, { type Types } from 'mongoose';

const DB = (process.env.DATABASE ?? '').replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD ?? '',
);
const APPLY = process.argv.includes('--apply');

interface ModuleRow {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleIndex: number;
  title: string;
  createdAt?: Date;
}

/** Ids of every module after the first in each (course, moduleIndex, title) group. */
export function findDuplicateModuleIds(modules: ModuleRow[]): Types.ObjectId[] {
  const sorted = [...modules].sort(
    (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) || String(a._id).localeCompare(String(b._id)),
  );
  const seen = new Set<string>();
  const duplicates: Types.ObjectId[] = [];
  for (const m of sorted) {
    const key = `${String(m.courseId)}|${m.moduleIndex}|${m.title.trim().toLowerCase()}`;
    if (seen.has(key)) duplicates.push(m._id);
    else seen.add(key);
  }
  return duplicates;
}

async function main(): Promise<void> {
  if (!DB) {
    console.error('Missing DATABASE / DATABASE_PASSWORD in config.env.');
    process.exit(1);
  }

  await mongoose.connect(DB);
  const coursesColl = mongoose.connection.collection('courses');
  const modulesColl = mongoose.connection.collection('modules');
  const lessonsColl = mongoose.connection.collection('lessons');

  const imported = await coursesColl
    .find({ youtubePlaylistId: { $exists: true, $ne: null }, active: { $ne: false } })
    .project({ _id: 1, title: 1 })
    .toArray();

  const modules = (await modulesColl
    .find({ courseId: { $in: imported.map((c) => c._id) }, active: { $ne: false } })
    .project({ _id: 1, courseId: 1, moduleIndex: 1, title: 1, createdAt: 1 })
    .toArray()) as unknown as ModuleRow[];

  const duplicateIds = findDuplicateModuleIds(modules);
  const dupSet = new Set(duplicateIds.map(String));
  const lessonCount = duplicateIds.length
    ? await lessonsColl.countDocuments({ moduleId: { $in: duplicateIds }, active: { $ne: false } })
    : 0;

  console.log(
    `Scanned ${imported.length} imported course(s), ${modules.length} module(s); ` +
      `${duplicateIds.length} duplicate module(s) holding ${lessonCount} lesson(s).`,
  );

  if (duplicateIds.length === 0) {
    console.log('Nothing to clean up.');
    await mongoose.disconnect();
    return;
  }

  const titleOf = new Map(imported.map((c) => [String(c._id), String(c.title ?? '(untitled)')]));
  const perCourse = new Map<string, number>();
  for (const m of modules) {
    if (dupSet.has(String(m._id))) {
      perCourse.set(String(m.courseId), (perCourse.get(String(m.courseId)) ?? 0) + 1);
    }
  }
  for (const [courseId, count] of perCourse) {
    console.log(`  • ${titleOf.get(courseId)}  [${courseId}] — ${count} duplicate module(s)`);
  }

  if (!APPLY) {
    console.log(
      `\nDRY RUN — no changes made. Re-run with --apply to soft-delete the ${duplicateIds.length} module(s) above and their lessons.`,
    );
    await mongoose.disconnect();
    return;
  }

  const lessons = await lessonsColl.updateMany(
    { moduleId: { $in: duplicateIds } },
    { $set: { active: false } },
  );
  const mods = await modulesColl.updateMany(
    { _id: { $in: duplicateIds } },
    { $set: { active: false } },
  );
  console.log(
    `\n✔ done — soft-deleted ${mods.modifiedCount} module(s) and ${lessons.modifiedCount} lesson(s). ` +
      'Cached module lists expire within 5 minutes (or restart Redis-backed cache).',
  );

  await mongoose.disconnect();
}

// Run only when executed directly, so the dedupe rule can be unit-tested.
if (/scripts[\\/]dedupeImportedModules\.(ts|js)$/.test(process.argv[1] ?? '')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
