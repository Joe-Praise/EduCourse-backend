import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet | undefined;

/**
 * Starts a single-node in-memory replica set. A replica set (not a standalone
 * server) is required because enrollment uses multi-document transactions.
 */
export async function connectTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  // Build unique indexes up front so duplicate-key behaviour is real.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function clearTestDb(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  await replSet?.stop();
}
