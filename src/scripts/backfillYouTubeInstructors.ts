/**
 * Backfill YouTube channel profiles onto existing `source: 'youtube'`
 * instructors that were imported BEFORE channel enrichment existed.
 *
 * Fetches avatar / bio / custom URL / subscriber count from the YouTube
 * channels endpoint and fills `channelThumbnailUrl`, `channelUrl`,
 * `subscriberCount`, and `description` (only if still the placeholder).
 *
 * Requires a YouTube Data API key. Reads it from YOUTUBE_API_KEY — either add
 * it to config.env or pass inline:
 *   YOUTUBE_API_KEY=<key> npx tsx src/scripts/backfillYouTubeInstructors.ts
 *
 * Flags:
 *   --all   re-fetch every YouTube instructor (default: only those missing an avatar)
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
const YT_KEY = process.env.YOUTUBE_API_KEY ?? '';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const REFRESH_ALL = process.argv.includes('--all');

interface YTChannel {
  id: string;
  snippet?: {
    description?: string;
    customUrl?: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
  statistics?: { subscriberCount?: string };
}

interface ChannelProfile {
  avatarUrl: string;
  bio: string;
  channelUrl: string;
  subscriberCount: number;
}

async function fetchChannels(ids: string[]): Promise<Map<string, ChannelProfile>> {
  const map = new Map<string, ChannelProfile>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', batch.join(','));
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', YT_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`  channels fetch failed (${res.status}) for batch ${i / 50 + 1}`);
      continue;
    }
    const data = (await res.json()) as { items?: YTChannel[] };
    for (const ch of data.items ?? []) {
      const t = ch.snippet?.thumbnails;
      const avatar = t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? '';
      const channelUrl = ch.snippet?.customUrl
        ? `https://www.youtube.com/${ch.snippet.customUrl}`
        : `https://www.youtube.com/channel/${ch.id}`;
      map.set(ch.id, {
        avatarUrl: avatar,
        bio: ch.snippet?.description ?? '',
        channelUrl,
        subscriberCount: Number(ch.statistics?.subscriberCount ?? 0) || 0,
      });
    }
  }
  return map;
}

async function main() {
  if (!YT_KEY) {
    console.error('Missing YOUTUBE_API_KEY. Add it to config.env or pass inline.');
    process.exit(1);
  }

  await mongoose.connect(DB);
  const coll = mongoose.connection.collection('instructors');

  const filter: Record<string, unknown> = { source: 'youtube' };
  if (!REFRESH_ALL) {
    filter.$or = [
      { channelThumbnailUrl: { $in: [null, ''] } },
      { channelThumbnailUrl: { $exists: false } },
    ];
  }

  const instructors = await coll
    .find(filter)
    .project({ _id: 1, channelId: 1, channelName: 1, description: 1 })
    .toArray();

  console.log(
    `Found ${instructors.length} YouTube instructor(s) to ${REFRESH_ALL ? 'refresh' : 'backfill'}.`,
  );
  if (instructors.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const channelIds = [
    ...new Set(instructors.map((i) => i.channelId).filter(Boolean) as string[]),
  ];
  const profiles = await fetchChannels(channelIds);
  console.log(`Fetched ${profiles.size} channel profile(s) from YouTube.`);

  let updated = 0;
  let skipped = 0;
  for (const ins of instructors) {
    const profile = ins.channelId ? profiles.get(ins.channelId) : undefined;
    if (!profile) {
      skipped += 1;
      continue;
    }
    const set: Record<string, unknown> = {};
    if (profile.avatarUrl) set.channelThumbnailUrl = profile.avatarUrl;
    if (profile.channelUrl) set.channelUrl = profile.channelUrl;
    if (profile.subscriberCount) set.subscriberCount = profile.subscriberCount;
    const desc = (ins.description as string) ?? '';
    if (profile.bio && (!desc || desc.startsWith('YouTube channel:'))) {
      set.description = profile.bio;
    }
    if (Object.keys(set).length === 0) {
      skipped += 1;
      continue;
    }
    await coll.updateOne({ _id: ins._id }, { $set: set });
    updated += 1;
    console.log(`  ✓ ${ins.channelName ?? ins.channelId} — ${Object.keys(set).join(', ')}`);
  }

  console.log(`\n✔ done — ${updated} updated, ${skipped} skipped (no channel match).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
