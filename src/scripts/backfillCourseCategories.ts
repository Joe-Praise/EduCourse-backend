/**
 * Backfill categories (+ tags) for AI-imported courses that have no category.
 *
 * Early YouTube imports ran before the auto-tagger was live (or before
 * handleAutoTags upserted categories), so they sit category-less and never
 * appear under any course-category filter. This re-fires the `auto-tagger`
 * agent for each such course; the agent generates a category name + tags and
 * calls back to PUT /admin/courses/:id/tags, which create-or-matches the
 * category and assigns it.
 *
 * Async by nature: this script just dispatches the triggers (the agent calls
 * back a few seconds later), so BOTH the backend and the agent-service must be
 * running. Re-running is safe — already-categorised courses are skipped.
 *
 * Run:  npx tsx src/scripts/backfillCourseCategories.ts
 *       npx tsx src/scripts/backfillCourseCategories.ts --all   (re-tag everything)
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import mongoose from 'mongoose';
import { safeTriggerAgent } from '../services/agentService.js';

// Read via the raw driver collections — bypasses Mongoose find hooks/populate
// (which would otherwise require registering the whole Course→Instructor→Link→
// User populate chain just to read a few fields).

const DB = (process.env.DATABASE ?? '').replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD ?? '',
);
const RETAG_ALL = process.argv.includes('--all');

async function main() {
  await mongoose.connect(DB);

  // AI-imported courses (have a youtubePlaylistId). Default: only those missing
  // a category; --all re-tags every AI course.
  const filter: Record<string, unknown> = {
    youtubePlaylistId: { $exists: true, $nin: [null, ''] },
  };
  if (!RETAG_ALL) {
    filter.$or = [{ category: { $exists: false } }, { category: null }];
  }

  const coursesColl = mongoose.connection.collection('courses');
  const lessonsColl = mongoose.connection.collection('lessons');

  const courses = await coursesColl
    .find(filter)
    .project({ title: 1, description: 1 })
    .toArray();

  console.log(
    `Found ${courses.length} AI course(s) to ${RETAG_ALL ? 're-tag' : 'categorise'}.`,
  );
  if (courses.length === 0) {
    await mongoose.disconnect();
    return;
  }

  let dispatched = 0;
  for (const course of courses as Array<{ _id: mongoose.Types.ObjectId; title: string; description?: string }>) {
    const courseId = String(course._id);
    const lessons = await lessonsColl
      .find({ courseId: course._id })
      .project({ title: 1 })
      .toArray();
    const lessonTitles = (lessons as Array<{ title?: string }>)
      .map((l) => l.title)
      .filter((t): t is string => Boolean(t));

    if (lessonTitles.length === 0) {
      console.log(`  · skipped "${course.title}" (no lessons for context)`);
      continue;
    }

    const res = await safeTriggerAgent('auto-tagger', {
      courseId,
      initiatedBy: 'script:category-backfill',
      context: {
        title: course.title,
        description: course.description,
        lessonTitles,
      },
    });

    if (res) {
      dispatched += 1;
      console.log(`  → dispatched auto-tagger for "${course.title}"`);
    } else {
      console.log(`  ✗ trigger failed for "${course.title}" (agent-service reachable?)`);
    }
  }

  console.log(
    `\n✔ dispatched ${dispatched}/${courses.length}. Categories will populate via callbacks in a few seconds.`,
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
