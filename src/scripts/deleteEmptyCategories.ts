/**
 * Delete course categories that have no courses attached to them.
 *
 * A category counts as "in use" if at least one non-soft-deleted course
 * (`active !== false`, any published status — drafts included) references it.
 * Only categories in the `course` group are considered; blog categories are
 * left untouched.
 *
 * DRY RUN BY DEFAULT — it only lists what would be deleted. Pass --apply to
 * actually delete (hard delete, since these are orphaned junk categories):
 *
 *   npx tsx src/scripts/deleteEmptyCategories.ts            # preview
 *   npx tsx src/scripts/deleteEmptyCategories.ts --apply    # delete
 *
 * Idempotent + safe to re-run.
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import mongoose from 'mongoose';

const DB = (process.env.DATABASE ?? '').replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD ?? '',
);
const APPLY = process.argv.includes('--apply');

async function main(): Promise<void> {
  if (!DB) {
    console.error('Missing DATABASE / DATABASE_PASSWORD in config.env.');
    process.exit(1);
  }

  await mongoose.connect(DB);
  const categoriesColl = mongoose.connection.collection('categories');
  const coursesColl = mongoose.connection.collection('courses');

  // Category ids actually referenced by at least one live course (drafts count;
  // soft-deleted courses do not). `distinct` dedupes for us.
  const usedRaw = await coursesColl.distinct('category', {
    active: { $ne: false },
    category: { $exists: true, $ne: null },
  });
  const used = new Set(usedRaw.map((id) => String(id)));

  const categories = await categoriesColl
    .find({ group: 'course', active: { $ne: false } })
    .project({ _id: 1, name: 1 })
    .toArray();

  const orphans = categories.filter((c) => !used.has(String(c._id)));

  console.log(
    `Scanned ${categories.length} course category(ies); ${used.size} in use; ` +
      `${orphans.length} with no courses attached.`,
  );

  if (orphans.length === 0) {
    console.log('Nothing to delete.');
    await mongoose.disconnect();
    return;
  }

  for (const c of orphans) {
    console.log(`  • ${(c.name as string) ?? '(unnamed)'}  [${String(c._id)}]`);
  }

  if (!APPLY) {
    console.log(
      `\nDRY RUN — no changes made. Re-run with --apply to delete the ${orphans.length} category(ies) above.`,
    );
    await mongoose.disconnect();
    return;
  }

  const ids = orphans.map((c) => c._id);
  const { deletedCount } = await categoriesColl.deleteMany({ _id: { $in: ids } });
  console.log(`\n✔ done — deleted ${deletedCount} empty category(ies).`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
