/**
 * One-time migration: rebuild the Instructor `userId` / `channelId` unique
 * indexes as PARTIAL indexes.
 *
 * Why: the original indexes were plain `unique` (and a later `sparse` tweak
 * never took effect because Mongoose doesn't rebuild an index when only its
 * options change). A non-sparse unique index treats a MISSING field as `null`,
 * so only one document could lack `userId` — which broke YouTube-imported
 * instructors (they have no userId) with `E11000 dup key: { userId: null }`.
 *
 * This drops the stale indexes and recreates them scoped by `$type`, so
 * uniqueness is enforced only for real values; user-less / channel-less docs
 * are excluded entirely.
 *
 * Run once:  npx tsx src/scripts/fixInstructorIndexes.ts
 * Safe to re-run (drops are guarded; creates are idempotent).
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import mongoose from 'mongoose';
const DB = (process.env.DATABASE ?? '').replace('<PASSWORD>', process.env.DATABASE_PASSWORD ?? '');
async function dropIfExists(coll, name) {
    const indexes = await coll.indexes();
    if (indexes.some((ix) => ix.name === name)) {
        await coll.dropIndex(name);
        console.log(`  dropped index ${name}`);
    }
    else {
        console.log(`  index ${name} not present (skip drop)`);
    }
}
async function main() {
    await mongoose.connect(DB);
    const coll = mongoose.connection.collection('instructors');
    console.log('Instructor indexes BEFORE:');
    console.log((await coll.indexes()).map((i) => `  ${i.name}: ${JSON.stringify(i.key)} ${i.unique ? 'unique' : ''} ${i.sparse ? 'sparse' : ''} ${i.partialFilterExpression ? 'partial' : ''}`).join('\n'));
    await dropIfExists(coll, 'userId_1');
    await dropIfExists(coll, 'channelId_1');
    await coll.createIndex({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } }, name: 'userId_1' });
    console.log('  created partial unique userId_1');
    await coll.createIndex({ channelId: 1 }, { unique: true, partialFilterExpression: { channelId: { $type: 'string' } }, name: 'channelId_1' });
    console.log('  created partial unique channelId_1');
    console.log('\nInstructor indexes AFTER:');
    console.log((await coll.indexes()).map((i) => `  ${i.name}: ${JSON.stringify(i.key)} ${i.unique ? 'unique' : ''} ${i.partialFilterExpression ? 'partial ' + JSON.stringify(i.partialFilterExpression) : ''}`).join('\n'));
    await mongoose.disconnect();
    console.log('\n✔ done');
}
main().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=fixInstructorIndexes.js.map