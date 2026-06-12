# Agentic AI Subsystem — Changes

Running changelog of changes shipped to the agentic AI subsystem (controllers, routes, middleware, models, service layer related to the external agent service).

The external agent service URL/secrets are populated by the user in `config.env`. **Never log values here — only the env var names.**

Format per entry:
- **What**: one-line summary
- **Why**: the problem being solved
- **Files**: paths (+ line numbers when useful)
- **Verify**: how to confirm the fix works

---

## 2026-06-12 — Backfill categories for AI courses

- **What** ([scripts/backfillCourseCategories.ts](src/scripts/backfillCourseCategories.ts), new): finds AI-imported courses (have a `youtubePlaylistId`) with no `category` and re-fires the `auto-tagger` agent for each (via `safeTriggerAgent`, with course title + lesson titles as context). The agent generates a category name + tags and calls back to `handleAutoTags`, which **upserts** (create-or-match) the category and assigns it. Reads via the raw driver collections to avoid the Course→Instructor→Link→User populate chain. `--all` re-tags everything; idempotent.
- **Why**: early imports ran before the auto-tagger was live, so they were category-less and invisible to the course-category filter. (The DB had a single category, "IT & Software".)
- **Verify**: **Ran live — dispatched 13/13.** Course categories went from 1 → 5 (Software Development, Programming, Game Development, Web Development, IT & Software); courses are now categorised + filterable. Requires the backend + agent-service running (async callbacks).

---

## 2026-06-10 — Invalidate course-list cache on import (new course shows immediately)

- **What**:
  - [cacheManager.ts](src/utils/cacheManager.ts): added `removePattern(pattern)` — SCAN-based (non-blocking) bulk delete of every key matching a glob, since the per-key `addToList`/`updateList` helpers can't reach the query-hashed list keys.
  - [agentCallbackController.ts](src/Controllers/agentCallbackController.ts) `handleYouTubeImport`: after a successful import, calls `cacheManager.removePattern(CacheKeyBuilder.pattern('course'))` to clear all `cache:course*` list/query variants.
- **Why**: A freshly imported course should appear on the courses page without a manual refresh. (`getAllCourses` currently has its read-cache commented out so it's already fresh, but this makes invalidation correct + future-proof if list caching is re-enabled.) Pairs with the frontend grid auto-refresh.
- **Verify**: Import a course → on the next `/courses` fetch the new (newest-first) course is in the list.
- **Requires backend restart.**

---

## 2026-06-10 — Built all 7 missing agents + YouTube-channel-as-instructor + AI badge

Large cross-repo feature: complete the agent fleet, and tie AI-imported courses to real, viewable instructors instead of floating user-less records.

### Agent-service (`Mr Mufasir/agent-service`) — 7 new agents
Built `course-summariser`, `auto-tagger`, `course-recommender`, `learning-path-builder`, `quiz-generator`, `progress-nudge`, `review-sentiment-analyzer` (each `src/agents/<name>/{index.ts,prompt.ts}`), modeled on `brand-writer`, calling back to our `/api/v1/admin/*` endpoints with `X-Agent-API-Key` + `agent_initiated: true`. Wired all 7 into `src/routes/agents.ts` (imports + Zod schemas + 202 fire-and-forget handlers + health array). Each matches its backend callback contract exactly:
- summariser → `{ difficulty, prerequisites, willBuild, summary[] }`
- auto-tagger → `{ tags[], category }`
- recommender → `{ recommendations[{courseId,reason,order}] }`
- learning-path → `{ goal, path[], estimatedWeeks, learningPathId }`
- quiz → `{ moduleIndex(>=1), questions[{question,options[4],answer:0-3}] }`
- nudge → `{ message, courseId? }`
- sentiment → `{ sentiment, flagged, moderationNote }`

Also added **YouTube channel enrichment** to `youtube-course-discovery`: `getChannelDetails()` (channels endpoint, `part=snippet,statistics`) pulls avatar / bio / customUrl / subscriberCount per channel; the import callback now carries `instructorAvatarUrl`, `instructorBio`, `instructorCustomUrl`, `subscriberCount` per course.

### Backend
- [instructorModel.ts](src/models/instructorModel.ts): added `channelThumbnailUrl`, `channelUrl`, `subscriberCount` (for user-less YouTube instructors).
- [agentCallbackController.ts](src/Controllers/agentCallbackController.ts): `upsertYouTubeInstructor` accepts + stores channel enrichment (and back-fills existing docs); `YouTubeImportedCourse` extended; the summariser/auto-tagger chain triggers now pass `context: { title, description, lessonTitles, moduleTitles }` so the agents need no extra round-trip; **review_alert** notification now resolves the instructor's real `userId` (and skips entirely for YouTube instructors) instead of pointing `Notification.userId` at an Instructor `_id`.
- [aiTriggerController.ts](src/Controllers/aiTriggerController.ts): `triggerRecommendations` now embeds `context: { availableCourses, completedCourseIds }`.

### Backfill (existing instructors)
- [scripts/backfillYouTubeInstructors.ts](src/scripts/backfillYouTubeInstructors.ts) (new): fetches channel profiles for `source: 'youtube'` instructors imported before enrichment existed; fills `channelThumbnailUrl` / `channelUrl` / `subscriberCount` / `description` (placeholder only). Reads `YOUTUBE_API_KEY` (config.env or inline). `--all` re-fetches everyone. Idempotent. **Ran against the live DB — 9 instructors backfilled, 0 skipped** (BornCG, Tensor Programming, Microsoft Developer, Let's Get Rusty, Trevor Sullivan, ByteByteGo, sudoCODE, Be A Better Dev, Gaurav Sen).

### Verify
- Import a course → its instructor renders a real YouTube avatar + bio + channel link, `aiSummary`/`aiTags` populate within ~30s (no more 404 chain), and an "AI-Compiled" badge shows.
- Trigger recommendations / learning path / quiz → agents respond + callbacks land.
- **Requires** restart of both the backend and the agent-service.

---

## 2026-06-06 — Tightened null guards in `handleReviewSentiment`

- **What** ([agentCallbackController.ts:429-490](src/Controllers/agentCallbackController.ts#L429)):
  - Extracted `reviewCourseId` once and short-circuit if the review has no `courseId` (returns 200 — the sentiment update still applied; we just can't escalate without a course reference).
  - Short-circuit if the referenced course was deleted/archived (`!course`).
  - Replaced `(course as any).title` / `.slug` / `.instructors[0]` with a single typed cast to `{ instructors?, title?, slug? }` and proper null coalescing.
  - The course's `slug` is now optional in the link; falls back to `/`.
- **Why**: Audit flagged unsafe `(review as any)` / `(course as any)` accesses without null checks. If the agent service ever sent a sentiment update for a review whose course had been archived, the original code would crash on `course.instructors?.[0]`.
- **Files**: `src/Controllers/agentCallbackController.ts`
- **Verify**: Send a sentiment callback for a review whose `courseId` points to a deleted course — should return `{ ok: true }` instead of throwing.

---

## 2026-06-06 — Extended Notification enum (`progress_nudge`, `review_alert`)

- **What** ([notificationModel.ts:18-31](src/models/notificationModel.ts#L18)):
  - Added `'progress_nudge'` and `'review_alert'` to the Notification.type enum.
- **Why**: `agentCallbackController.ts` was creating notifications with `type: 'progress_nudge'` (line 409) and `type: 'review_alert'` (line 468) — neither was in the schema enum. Every such call would fail Mongoose validation at runtime. Latent bug.
- **Files**: `src/models/notificationModel.ts`
- **Verify**: After an agent fires a progress nudge callback, `db.notifications.find({type:'progress_nudge'}).limit(1)` returns the document instead of nothing.

---

## 2026-06-06 — Status markers + soft-delete + indexes on async AI models

- **What**:
  - Added `status: 'pending' | 'ready' | 'failed'` field with default `'pending'` to `Recommendation`, `LearningPath`, and `Quiz` models.
  - Added `active: Boolean` field with select:false + a `pre(/^find/)` soft-delete hook to all three (parity with the rest of the codebase, addresses Recommendation/LearningPath audit gap).
  - Added a single-field index on `LearningPath.userId` to cover unsorted lookups (`find({userId})` was hitting the compound `{userId, createdAt}` only and could degrade as paths-per-user grew).
  - Updated `aiTriggerController.ts`:
    - `triggerRecommendations` upserts a Recommendation doc with `status:'pending'` BEFORE calling the agent; marks it `'failed'` and returns 503 if the agent service is unreachable.
    - `triggerLearningPath` creates a pending LearningPath doc, passes `learningPathId` to the agent so the callback can update the same doc.
    - `triggerQuizGeneration` upserts a pending Quiz doc keyed on `{courseId, moduleIndex}`.
    - All three switched from `triggerAgent` to `safeTriggerAgent` so the pending doc + the AgentRun audit trail both survive even if the agent call throws.
    - All `get*` endpoints now return `generationStatus: 'pending'|'ready'|'failed'|'not_requested'` so clients can distinguish "never asked" from "asked, waiting" from "ready" from "failed". `data` is null unless status is `ready`.
    - `getQuiz` only caches when status is `'ready'` (don't poison the cache with a pending doc).
  - Updated `agentCallbackController.ts`:
    - `handleRecommendations` upsert now sets `status: 'ready'` on the doc.
    - `handleLearningPath` accepts optional `learningPathId` in body — if present, updates that specific pending doc to `'ready'` (preserving the pending→ready transition the user experienced); falls back to creating a new ready doc if missing.
    - `handleQuiz` sets `status: 'ready'` in the upsert.
- **Why**:
  - **Status markers**: Audit flagged that quiz/recommendation polling returns `null` whether the agent hasn't been triggered, the trigger is in flight, OR the agent failed. Clients had no way to distinguish, so a "Generate quiz" button could appear to do nothing for 30s then suddenly populate. Now clients can show "Generating…" UI based on `generationStatus`.
  - **Soft-delete filters**: Every other Mongoose model in the codebase has this pattern (`pre(/^find/)` filtering by `active`); these three were the only outliers, flagged by the backend audit.
  - **Single-field userId index**: The existing compound index `{userId, createdAt}` only covers queries that explicitly sort by createdAt; a bare `find({userId})` could fall through to a collection scan as data grows.
- **Files**:
  - Models: `src/models/{recommendationModel, learningPathModel, quizModel}.ts`
  - Controllers: `src/Controllers/aiTriggerController.ts`, `src/Controllers/agentCallbackController.ts`
- **Verify**:
  - Call `POST /api/v1/ai/recommendations/trigger` then immediately `GET /api/v1/ai/recommendations` — response should include `generationStatus: 'pending'` and `data: null`.
  - After the agent callback fires, the same GET should return `generationStatus: 'ready'` with the recommendations.
  - Force agent failure (bad URL); the GET should return `generationStatus: 'failed'`.
  - `db.learningpaths.getIndexes()` should show both `{userId:1, createdAt:-1}` and `{userId:1}` indexes.
  - Soft-delete a recommendation (`active: false`) and confirm `Recommendation.findOne({userId})` returns null.

---

## 2026-06-09 — Fixed E11000 on import (stale non-sparse `userId` index) + surfaced failure reasons

- **Symptom**: Every multi-course YouTube import failed — `handleYouTubeImport` returned `500: All courses in the callback payload failed to import`. The per-course reason was `E11000 duplicate key error: instructors index: userId_1 dup key: { userId: null }`.
- **Root cause**: The live `instructors.userId_1` index was **plain `unique`** (no sparse/partial). The schema had been updated to `sparse` later, but Mongoose never rebuilds an existing index when only its options change. A non-sparse unique index treats a *missing* field as `null`, so only ONE instructor could lack `userId`. YouTube instructors have no `userId` — the first import (godot) claimed the single `null` slot; every later user-less instructor (the 4 rust courses) collided. (And `sparse` wouldn't have fully fixed it either — sparse still indexes explicit `null`.)
- **Fix**:
  - [instructorModel.ts](src/models/instructorModel.ts): `userId` / `channelId` unique indexes are now **partial** — `partialFilterExpression: { userId: { $type: 'objectId' } }` and `{ channelId: { $type: 'string' } }`. Uniqueness is enforced only for real values; user-less / channel-less docs are excluded from the index entirely. (Also fixes the mirror bug: user-created instructors have no `channelId`.)
  - [scripts/fixInstructorIndexes.ts](src/scripts/fixInstructorIndexes.ts) (new, idempotent): drops the stale `userId_1` + `channelId_1` and recreates them partial. **Ran against the live DB** — confirmed `BEFORE: userId_1 unique` → `AFTER: userId_1 unique partial {userId:$type objectId}`. DB-level fix, no backend restart required.
  - [agentCallbackController.ts](src/Controllers/agentCallbackController.ts) `handleYouTubeImport`: now collects each course's failure reason and includes it in the 500 response (`… failed to import — course 0 ("title"): <reason> | …`) + logs `[import] ✗ failed to import course index N ("title"): <reason>`. Previously the endpoint returned a blank "all failed" with the reason only in the console — this is what made the diagnosis slow.
- **Verify**: Live re-run of "Introduction to Rust" → agent `status: success`, course published with 4 instructors created, zero E11000. ✔
- **For fresh DBs**: the schema now defines the partial indexes, so `autoIndex` builds them correctly; the migration script is only needed for existing databases.

---

## 2026-06-09 — Fixed env load-order bug (trigger threw "AGENT_SERVICE_SECRET is not configured")

- **What** ([agentService.ts](src/services/agentService.ts)): Converted the module-load constants `AGENT_SERVICE_URL` / `AGENT_SERVICE_SECRET` / `AGENT_PROJECT_ID` into **lazy call-time getters** (`agentServiceUrl()`, `serviceSecret()`, `projectId()`).
- **Why**: `server.ts` calls `dotenv.config()` *after* `import app from './app.js'`. ESM hoists all `import` statements to the top, so `app.js` (→ `agentService.ts`) loads BEFORE dotenv populates `process.env`. The top-level `const SERVICE_SECRET = process.env.AGENT_SERVICE_SECRET` therefore captured `undefined`, and `triggerAgent` threw `AGENT_SERVICE_SECRET is not configured` on every real trigger — even though `config.env` had the value. (Other config reads env lazily/at connect time, so only the agent trigger broke.) Reading at call time removes the import-order dependency entirely.
- **Verify**: Restart backend → search a non-existent course → logs now show `[agent] ✓ accepted` instead of the "not configured" error, and the import completes.
- **Requires restart.**

---

## 2026-06-09 — [agent-service] Clean lesson titles (strip repeated series name + ordinal)

> Cross-repo change in `agent-service/src/agents/youtube-course-discovery/index.ts` (the external agent), recorded here because it shapes imported course content.

- **What**: Added `cleanLessonTitles()` applied to each playlist's video titles before module grouping + callback. It (1) strips the longest prefix common to all videos in the playlist (the repeated series name, trimmed to a word boundary), (2) strips a leading ordinal marker (`Lesson #1:`, `Part 2 -`, `#3`, `01.`, etc.), (3) falls back to the original if cleaning empties the title.
- **Why**: Raw YouTube titles like `"Godot 4 3D Platformer Lesson #1: Let's Get Started!"` repeat the course name on every lesson. Now they read `"Let's Get Started!"`. Number-led real titles ("10 Tips for X") are preserved (the ordinal strip requires a trailing separator).
- **Verify**: Re-import a course → lesson titles in the curriculum no longer carry the series prefix. (Existing imports keep their old titles until re-imported.)
- **Requires agent-service restart.**

---

## 2026-06-09 — Import lifecycle logs + autocomplete exposes `publishedStatus`

- **What**:
  - Added `logger.info` traces across the whole import lifecycle so the backend console shows what's happening:
    - `courseController` (search branch): `[import] no catalog match for "<q>" → creating draft + triggering YouTube discovery` and `[import] draft <id> created (status: importing)`.
    - `agentService.safeTriggerAgent`: `[agent] → dispatching "<type>" (<context>) to agent-service…` then `[agent] ✓ "<type>" accepted by agent-service (running async)` (or the existing error log on failure).
    - `agentCallbackController.handleYouTubeImport`: `[import] ← YouTube callback for course <id>: N course(s) discovered for "<q>"`, per-course `[import] ✓ "<title>" → <id> (M modules, L lessons)`, and `[import] ✔ done — N course(s) published for "<q>"`.
  - `atlasAutocomplete` ([courseController.ts](src/Controllers/courseController.ts)): added `publishedStatus` to the `$project` so the frontend can badge/guard `importing` drafts.
- **Why**: The user couldn't tell whether an import was running. These `[import]`/`[agent]`-prefixed lines make the YouTube-decision → dispatch → callback → publish chain greppable in dev logs (`logger.info` is silenced in production).
- **Verify**: Search a non-existent course → backend logs print the `[import]` decision + `[agent]` dispatch, then `[import] ← YouTube callback …` and `[import] ✔ done` when the agent calls back.

---

## 2026-06-08 — Fixed `AgentRun.initiatedBy` type (was silently dropping every run)

- **What** ([agentRunModel.ts](src/models/agentRunModel.ts)): Changed `initiatedBy` from `{ type: Schema.Types.ObjectId, ref: 'User' }` to `{ type: String }`.
- **Why**: Callers pass descriptive origin strings — `'api'`, `user:<id>`, `agent:youtube-course-discovery` — none of which are valid ObjectIds. Every `AgentRun.create(...)` threw a CastError that `safeTriggerAgent`'s `.catch()` swallowed, so **zero AgentRun docs ever persisted** (confirmed live: `countDocuments() === 0` after multiple triggers). The trigger itself still fired (persistence failure is non-blocking by design), but the observability the model exists for was completely defeated.
- **Verify**: After a backend restart, trigger any agent → `db.agentruns.find()` now shows a row with `status` transitioning `pending → accepted`.
- **Requires restart** to take effect (model is loaded at process start).

---

## 2026-06-08 — Raised body limit on `/api/v1/admin/*` (agent callbacks were 413ing)

- **What** ([app.ts](src/app.ts)): Mounted a dedicated `express.json({ limit: '2mb' })` parser for `/api/v1/admin` BEFORE the global `express.json({ limit: '10kb' })`. Admin requests get parsed by the generous parser first (sets `req._body`), so the global 10kb parser skips them; all other routes keep the tight 10kb anti-DoS bound.
- **Why**: Live end-to-end test of `youtube-course-discovery` revealed the agent's callback to `PUT /api/v1/admin/courses/:id/youtube-import` was rejected with **413 request entity too large** — the import payload (4 courses × modules × videos) was ~11.2KB vs the global 10KB cap. The agent logged `status: error, "Project API returned 413"`. The agent + YouTube + OpenAI all worked; only the backend body cap blocked the import. Other agent callbacks (quiz with many questions, recommendation lists) can also exceed 10KB, so the fix is scoped to the whole authenticated admin router, not just the youtube route.
- **Verify**: Re-run a YouTube import; the callback should now return 200 and the draft course flips `importing → published` with modules/videos populated.
- **Note for operators**: `agentService.ts` reads `AGENT_SERVICE_URL` / `AGENT_SERVICE_SECRET` / `AGENT_API_KEY` as **module-load constants** — a backend process started before those env vars were populated keeps them empty until restarted. Always restart the backend after changing `AGENT_*` env.

---

## 2026-06-06 — Persisted agent runs + sanitized error messages

- **What**:
  - Created `src/models/agentRunModel.ts` — every outbound `triggerAgent` call now writes a document capturing `agentType`, `status` (`pending`/`accepted`/`failed`), `initiatedBy`, `context`, `payload` (sanitized), `response`, `error`, `completedAt`, plus standard timestamps. Indexes: `{agentType, status, createdAt}` for status dashboards, `{initiatedBy, createdAt}` for per-user run history.
  - Rewrote `services/agentService.ts`:
    - `safeTriggerAgent` no longer just logs-and-returns-null on failure. It creates an `AgentRun` doc upfront (`status: 'pending'`), then updates it to `'accepted'` with the response on success or `'failed'` with the sanitized error on failure. DB write failures don't block the trigger.
    - `safeTriggerAgent` strips `serviceSecret` and `apiKey` keys from the payload before writing to DB (defense in depth — these shouldn't be in the payload to begin with, but belt-and-suspenders).
    - New `sanitizeError(msg)` helper redacts `AGENT_SERVICE_URL` and any `X-Service-Secret: ...` substrings from error messages before they're logged OR persisted. Stops the audit-flagged secret-in-logs risk.
- **Why**: Audit flagged `safeTriggerAgent` as a silent failure point — YouTube imports succeeded in DB but the chained agents could fail with nothing logged. Persistence makes the queue observable and retryable. Sanitization is a defense-in-depth measure: if the URL ever carries a token (common pattern for callback URLs), we don't want it in either logs or the DB.
- **Files**: `src/models/agentRunModel.ts` (new), `src/services/agentService.ts` (rewritten)
- **Verify**:
  - After any agent trigger (even from dev): `db.agentruns.find().sort({createdAt:-1}).limit(5)` should show the run with its status.
  - Force a failure (set bogus `AGENT_SERVICE_URL`), check that the error in the DB and the log line both say `<AGENT_SERVICE_URL>` not the actual URL.
  - `npx tsc --noEmit` passes.

---

## 2026-06-05 — Documentation scaffolding

- **What**: Created `docs/AI_CHANGES.md` (this file).
- **Why**: Split AI changes from general backend changes so the agentic subsystem narrative stays coherent.
- **Files**: `docs/AI_CHANGES.md`
- **Verify**: File exists.

---

## Subsystem snapshot (state at start of optimization pass)

**Registered agents** (8 — see `src/Controllers/aiTriggerController.ts` + `agentCallbackController.ts`):
- `youtube-course-discovery`, `course-summariser`, `auto-tagger`, `course-recommender`, `learning-path-builder`, `quiz-generator`, `progress-nudge`, `review-sentiment-analyzer`

**Routes**:
- `/api/v1/ai/*` — user-facing triggers (rate-limited 10/min via `aiLimiter`)
- `/api/v1/admin/*` — callback endpoints (`verifyAgentCallback` API-key middleware)

**Service layer**:
- `src/services/agentService.ts` — outbound HTTP to external `AGENT_SERVICE_URL` with `AGENT_SERVICE_SECRET`. `safeTriggerAgent` wraps each call in a silent catch (to be replaced with structured logging).

**Required env vars** (user-managed, populated outside this work scope):
- `AGENT_SERVICE_URL` — base URL of external agent service
- `AGENT_SERVICE_SECRET` — secret used in callback HMAC
- `AGENT_API_KEY` — API key the external service uses to authenticate to us on callback
- `AGENT_PROJECT_ID` — project namespace (default: `building-safety`)
