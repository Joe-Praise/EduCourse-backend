# Backend Changes

Running changelog of changes shipped to the Building Safety Project backend during the app-wide optimization pass. Newest entries at the top.

Format per entry:
- **What**: one-line summary
- **Why**: the problem being solved
- **Files**: paths (+ line numbers when useful)
- **Verify**: how to confirm the fix works

---

## 2026-06-11 — Empty categories hidden from course filter + clearCookie deprecation

- **Categories with no published course are hidden** ([categoryController.ts](src/Controllers/categoryController.ts)): `getAllCategory` is now a custom controller — for `?group=course` it returns only categories referenced by a published course (`Course.distinct('category', { publishedStatus: 'published' })`), same pattern as the instructors filter. Blog/ungrouped queries unchanged. Empty categories no longer clutter the courses filter/frontend.
- **`res.clearCookie` deprecation fixed** ([authController.ts](src/Controllers/authController.ts)): the refresh-cookie clear passed `refreshCookieOptions()` which includes `expires` — Express logs `res.clearCookie: Passing "options.expires" is deprecated`. Added a dedicated `refreshClearOptions()` (matching path/httpOnly/secure/sameSite, **no** `expires`) used by both `clearCookie` calls.
- **Verify**: courses filter lists only non-empty categories; logging out no longer prints the clearCookie deprecation warning. **Requires backend restart.**

---

## 2026-06-11 — Instructors list shows only instructors with a published course

- **What** ([instructorController.ts](src/Controllers/instructorController.ts)): replaced `getAllInstructors = getAll(Instructor)` with a custom controller that first resolves `Course.distinct('instructors', { publishedStatus: 'published' })` and returns only those instructors (`Instructor.find({ _id: { $in } })`), preserving the APIFeatures + Pagination + `metaData` envelope.
- **Why**: The public instructors page was listing empty/draft instructors (and failed-import shells) with no published courses. Now only instructors who actually have a published course appear.
- **Verify**: `GET /api/v1/instructors` → every returned instructor has ≥1 published course. **Requires backend restart.**

---

## 2026-06-08 — Refresh-token rotation + idle-logout flow

The 90-day JWT meant a stolen access token was effectively a permanent backdoor and there was no inactivity protection. Replaced with short-lived access tokens + a rotating refresh token, with the inactivity logout on the client.

### Backend
- New `RefreshToken` model ([refreshTokenModel.ts](src/models/refreshTokenModel.ts)): stores only the SHA-256 hash of each refresh token (raw token never persisted), with `userId`, `expiresAt`, `revoked`, `userAgent`, `ip`. TTL index auto-purges expired rows. Statics: `hashToken`, `generateRaw`, `revokeAllForUser`.
- Updated `createSendToken` in `authController.ts` to issue BOTH:
  - **Access JWT** — `JWT_EXPIRES_IN` (now `15m`), set as `jwt` httpOnly cookie + returned in response body for clients that use the `Authorization: Bearer` header.
  - **Refresh token** — 48-byte random hex, set as `rt` httpOnly cookie scoped to `/api/v1/users` (reduces surface area). Persisted hashed in DB.
- New endpoints:
  - `POST /api/v1/users/refresh` — body-less, reads `rt` cookie. Validates + ROTATES (revokes the submitted token, issues a brand-new pair). If a REVOKED token is reused, treats as a stolen session and calls `revokeAllForUser` — single compromised token nukes that user's sessions.
  - `POST /api/v1/users/logout` — revokes the refresh token, clears both cookies, destroys the express-session.
- Installed `cookie-parser` and wired it into the middleware chain (required to read `req.cookies` for the new flows).
- Added `REFRESH_TOKEN_EXPIRES_IN_DAYS` env var (default 7). Updated `config.env.example`.

### Why these specific design choices
- **Hashed-only refresh tokens** — DB compromise can't be used to impersonate active sessions.
- **Rotation on every refresh** — minimizes the window in which a stolen refresh token is usable.
- **Reuse detection** — if a revoked token is submitted again, that's a strong signal of theft; revoking all sessions for the user is the safest response.
- **Path-scoped refresh cookie (`/api/v1/users`)** — the cookie isn't sent to any other endpoint, reducing the chance of accidental leakage via logging or third-party middleware.
- **Access JWT also as a cookie** — backward-compatible with the existing cookie-first `protect` flow; new clients can use either Authorization header or cookie.

### Files
- New: `src/models/refreshTokenModel.ts`
- Modified: `src/Controllers/authController.ts`, `src/Routes/userRoutes.ts`, `src/app.ts`, `config.env.example`, `package.json` (cookie-parser)

### Verify
- Sign in → response body now includes `expiresIn: '15m'`; browser dev tools shows `jwt` (session cookie) + `rt` (7-day cookie scoped to `/api/v1/users`).
- Wait > 15 minutes, then make any authenticated request → backend returns 401 → frontend interceptor calls `/refresh` → succeeds → original request retries automatically.
- Manually delete the `rt` cookie, then trigger any request → first call 401s → refresh fails → user is logged out.
- Hit `POST /users/logout` → both cookies cleared, refresh token marked `revoked: true` in DB. Subsequent `/refresh` returns 401.

---

## 2026-06-08 — Three Sentry-flagged bugs fixed

User pulled these from Sentry. Patched all three:

### Bug 1 — `TypeError: Cannot read properties of undefined (reading '_id')`
- **Where**: `courseController.ts:183` in the slug branch of `GET /api/v1/courses` — `doc[0]._id` crashed when `Course.find({ slug })` returned an empty array (deleted, archived, or non-existent slug).
- **Fix**: Added `if (!doc || doc.length === 0 || !doc[0]?._id) return next(new AppError('No course found with that slug', 404))` before the module lookup. Returns a clean 404 instead of crashing the request and 500ing.

### Bug 2 — `CastError: Cast to ObjectId failed for value "me"` on `GET /api/v1/certificates/me`
- **Where**: `handlerFactory.ts:187` in the `getOne` factory. The literal `/me` route was being matched as `/:id` (likely on an older deploy before `/me` was registered), Mongoose tried `Certificate.findById('me')`, crashed.
- **Fix**: Added a defense-in-depth guard at the top of `getOne` — `if (!Types.ObjectId.isValid(id)) return next(new AppError('No document found with that ID', 404))`. Any literal-path/`:id` route collision now returns a clean 404 instead of an opaque CastError. Sentry stops being spammed.
- **Files**: `src/Controllers/handlerFactory.ts`

---

## 2026-06-08 — Phase 5: SSE notifications stream + notification preferences

### SSE real-time notification stream
- **What** ([notificationController.ts](src/Controllers/notificationController.ts) — new `streamNotifications`): `GET /api/v1/notifications/stream` opens a Server-Sent Events stream for the auth'd user. Sets `text/event-stream` + `no-cache` + `no-transform` + `X-Accel-Buffering: no` (kills nginx buffering), flushes headers immediately, sends a `: connected <ts>` comment, registers an `appEvents` listener on `NOTIFICATION.CREATED` that filters by `userId` and pushes `data: {type:'notification.created', data:<doc>}` payloads. 25s heartbeat keeps proxies from idle-closing. Cleans up listener + interval on `req.close`.
- **Route**: `router.get('/stream', streamNotifications)` — placed BEFORE `/:id` so the literal "stream" path isn't matched as a notification id.
- **Why**: Audit flagged "real-time notifications — polling only". Bell icon now updates within ~1s of any backend-triggered notification instead of next page-load.
- **Verify**: `curl -N --cookie 'jwt=...' http://localhost:3050/api/v1/notifications/stream` — should stream a `: connected` comment immediately and `data:` blocks as notifications fire.

### Notification preferences
- **What**: New `NotificationPreference` model + two endpoints:
  - `src/models/notificationPreferenceModel.ts` — per-user (`unique` on `userId`) document with seven `{inApp, email}` channel pairs (one per Notification type) plus a master `enabled` switch. Defaults: every type in-app, none email. Soft-delete via `active: false` + pre-find hook.
  - `GET /api/v1/notifications/preferences` (`getMyNotificationPreferences`) — upserts a default doc if missing and returns it. Idempotent.
  - `PATCH /api/v1/notifications/preferences` (`updateMyNotificationPreferences`) — accepts a partial body, writes only known keys with dotted-path `$set`, ignores unknown keys, upserts on first write.
  - `isPreferenceType(value)` helper exported for the publishing layer's eventual `shouldDeliver(userId, type, channel)` check.
- **Routes**: Both endpoints precede `/:id` so "preferences" isn't matched as an id.
- **Why**: Audit flagged "no notification preferences — can't toggle email vs in-app, can't choose digest frequency, can't mute categories". The frontend now exposes these via a new tab on `/profile`.
- **Verify**: `GET /preferences` returns default doc. `PATCH /preferences` with `{ "review": { "email": true } }` flips only that one channel, leaves the rest at default.

---

## 2026-06-08 — Lecture endpoint surfaces `completedCourseId`

- **What** ([courseController.ts:349](src/Controllers/courseController.ts#L349) — `getLectureCourse`): Response now includes `completedCourseId` (the `CompletedCourse._id`) alongside the existing `completedLessons` array.
- **Why**: The frontend needs the document id to PATCH `/completed-courses/:id` and mark a lesson complete when the user finishes watching it. Without this, the progress ring stayed at 0% forever because there was no way to update the source of truth from the lecture view.
- **Files**: `src/Controllers/courseController.ts`
- **Verify**: `GET /api/v1/courses/learn/:userId/:courseId` response should now include both `completedLessons: [...]` and `completedCourseId: "..."`.

---

## 2026-06-07 — `unifiedSearch` now filters to active + published courses

- **What** ([searchController.ts](src/Controllers/searchController.ts)): Added a `$match` stage right after `$search` in the course aggregation that enforces `active: { $ne: false }` AND `publishedStatus: 'published'`. The blog query already filtered `active`. Also cleaned up `(d: any)` casts.
- **Why**: Atlas `$search` runs outside Mongoose's `pre(/^find/)` middleware, so soft-deleted and draft courses were being surfaced in search results. Found while reviewing user-flagged behavior.
- **Files**: `src/Controllers/searchController.ts`
- **Verify**: Create a draft course → search for its title → should NOT appear. Publish it → should appear.

---

## 2026-06-07 — Lecture endpoint surfaces `completedLessons` for course-resume

- **What** ([courseController.ts](src/Controllers/courseController.ts) — `getLectureCourse`): The response payload now includes `completedLessons: string[]` per course, derived from the user's `CompletedCourse.lessonsCompleted` (after self-heal). Frontend uses it to auto-jump to the first uncompleted lesson on page load.
- **Why**: Audit flagged that lesson progress was tracked but never read on the lecture view — every session restarted from lesson 1.
- **Files**: `src/Controllers/courseController.ts`
- **Verify**: Call `GET /api/v1/courses/learn/:userId/:courseId` for a course with completed lessons → response includes `completedLessons: ["..."]` array.

---

## 2026-06-07 — `GET /certificates/me` endpoint

- **What**: Added `getMyCertificates` controller — returns the auth'd user's certificates with `courseId` populated (title, slug, imageCover, instructors[].userId.name). Sorted newest first. Route added BEFORE `/:id` so the literal "me" doesn't get matched as an id.
- **Why**: Audit flagged "no certificate viewing UI". The handler-factory `getAll` doesn't support populate, so a dedicated endpoint was needed. The previous `getAll` would have leaked all users' certificates.
- **Files**: `src/Controllers/certificateController.ts`, `src/Routes/certificateRoutes.ts`
- **Verify**: `GET /api/v1/certificates/me` (with auth) returns the calling user's certificates with course populated.

---

## 2026-06-06 — `docs/API.md` reference

- **What**: Wrote a single-file reference covering every mounted route on `/api/v1/*` — auth requirements, request shape, response envelope, pagination defaults, rate limits, and integration notes (soft-delete, Atlas Search, AI subsystem env vars). Hand-written rather than auto-generated OpenAPI since the latter would require annotating ~50+ endpoints with JSDoc.
- **Why**: Audit flagged "no API documentation" as a high-impact gap. Onboarding any new dev / external integrator currently means reading controller files. This document makes the surface area visible at a glance.
- **Files**: `docs/API.md`
- **Verify**: Compare against `src/app.ts` route mounts — every `app.use('/api/v1/<x>', router)` should be represented in a section here. If a route lands on this file without docs, log a follow-up.

---

## 2026-06-06 — Sentry error tracking (no-op when DSN absent)

- **What**:
  - Installed `@sentry/node`.
  - Created `src/utils/sentry.ts` — `initSentry()` (idempotent + no-op when `SENTRY_DSN` is empty so local dev works zero-config) and `captureException(err, ctx)` helper.
  - Wired `initSentry()` into `src/server.ts` BEFORE the `app.js` import so module-init crashes are still captured.
  - `process.on('uncaughtException')` and `unhandledRejection` handlers now call `captureException` alongside the existing logger.
  - `errorController.ts` (global Express error handler) now captures every non-operational error or `>=500` response to Sentry, with `{url, method, statusCode}` extra context.
  - Added `SENTRY_DSN=` placeholder to `config.env.example`.
  - Renamed unused `next` to `_next` in errorController signature.
- **Why**: Audit flagged "no error tracking" — production bugs are invisible until a user reports them. Sentry is the standard. Gating on DSN means local dev + new clones have no setup friction.
- **Files**: `src/utils/sentry.ts` (new), `src/server.ts`, `src/Controllers/errorController.ts`, `config.env.example`, `package.json`
- **Verify**: Set `SENTRY_DSN` to a real DSN, throw a non-operational error in any controller — should appear in the Sentry project's Issues tab. Without DSN, every Sentry call is a no-op.

---

## 2026-06-06 — CI workflow (`.github/workflows/ci.yml`)

- **What**:
  - Added `.github/workflows/ci.yml` — runs `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build` on every PR + push to main.
  - Added `typecheck` script (`tsc --noEmit`) and `lint` script (`eslint src --ext .ts --max-warnings 0`) to `package.json`. Lint had no script before — the dependency was installed but never run.
  - Lint step uses `continue-on-error: true` initially so PRs aren't blocked by legacy warnings; flip to `false` once the baseline is clean.
- **Why**: Audit flagged "no CI/CD pipeline — linting + type-checks never run automatically". A typo in main is now caught at PR time.
- **Files**: `.github/workflows/ci.yml`, `package.json`
- **Verify**: Push any branch to GitHub, open a PR — CI run should appear in the Actions tab and the PR status check.

---

## 2026-06-06 — Hardened lecture-course endpoint (defense in depth + 403 semantics)

- **What** ([courseController.ts:349-368](src/Controllers/courseController.ts#L349)):
  - Added a defense-in-depth check: if the URL `:userId` param is present and doesn't match `req.user._id`, return 403 immediately. The handler always read the user from the JWT, but the URL param previously could be set to anything without consequence — surfacing the mismatch makes probing attempts loggable.
  - Changed the "Register for course to get access" error from `400 Bad Request` to `403 Forbidden` (the request is well-formed; it's the auth state that's wrong).
  - Removed two `logger.debug('🚀 ~ ...')` debugging artifacts that had leaked from a debugging session.
- **Why**: Audit flagged the lecture route as missing an enrollment check. On closer reading, the enrollment check was already present and correct (lines 359-368); the real gap was (a) the misleading URL `:userId` param the handler ignored, and (b) the wrong HTTP status. Both fixed.
- **Files**: `src/Controllers/courseController.ts:349-368`
- **Verify**: Hit `GET /api/v1/courses/learn/<otherUserId>/<courseId>` as user A — should return 403. Hit it without enrolling — should return 403 with `Register for course to get access`.

---

## 2026-06-06 — Replaced 68 `console.*` calls with NODE_ENV-gated `logger`

- **What**:
  - Created `src/utils/logger.ts` — a 4-method wrapper (`debug` / `info` / `warn` / `error`). `debug`/`info` are no-ops when `NODE_ENV === 'production'`. `warn`/`error` always log.
  - Bulk-replaced every `console.log` → `logger.debug`, `console.info` → `logger.info`, `console.warn` → `logger.warn`, `console.error` → `logger.error` across 17 files (68 occurrences total).
  - Added the `import { logger }` line to each file.
  - In `server.ts`: upgraded the lifecycle messages by hand — `uncaughtException` / `unhandledRejection` → `logger.error` (always logs), `Mongodb connected` / `App running on port` → `logger.info` (dev-only). Stripped the U+274C emoji that was in the original message (one ESM-encoding fewer thing to break in logs).
- **Why**: Production logs were leaking permission-check details (`User X with roles [...] tried Y on Z`), session/header dumps, and noisy success messages. The audit flagged 68 such calls across 17 files. Routing through a single logger gives us one knob to swap for Pino/Winston later.
- **Files**: `src/utils/logger.ts` (new), plus 17 files: `app.ts`, `server.ts`, `Controllers/{userController, courseController, agentCallbackController, completedCourseController, moduleController, errorController}.ts`, `middlewares/{authMiddleware, verifyAgentCallback, cacheInvalidator}.ts`, `services/agentService.ts`, `config/{cache, redis}.ts`, `utils/{redisCacheUtils, apiFeatures, timeConverter}.ts`.
- **Verify**: `npx tsc --noEmit` passes. Set `NODE_ENV=production` and confirm debug/info lines disappear from stdout while warn/error still log.

---

## 2026-06-06 — Removed deprecated `xss-clean`, installed `helmet`

- **What**:
  - Uninstalled `xss-clean@0.1.4` (unmaintained since 2020).
  - Deleted `src/types/xss-clean.d.ts` type shim.
  - Installed `helmet@latest` and registered it early in the middleware chain (right after CORS, before static + routes).
  - Removed the `xss-clean.d.ts` exclusion from the `clean` script in `package.json`.
- **Why**: `xss-clean` is deprecated and was already removed from `app.ts`; only the package + type shim remained as dead weight. `helmet` was missing entirely, so HTTP responses had no X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, or Referrer-Policy headers. XSS payload sanitization is already handled per-route by `sanitize-html`-based middlewares (`strictXssSanitizer.ts`, `richTextSanitizer.ts`).
- **Files**: `src/app.ts` (helmet wired), `src/types/xss-clean.d.ts` (deleted), `package.json`.
- **Verify**: `curl -I http://localhost:3050/api/v1/category` should now return `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security: max-age=...`, etc. `npx tsc --noEmit` passes clean.
- **Note**: CSP intentionally disabled in helmet config — Cloudinary asset URLs + dynamic styling require an extensive directive list to allowlist. Re-enable once the asset/CDN allowlist is mapped.

---

## 2026-06-05 — Created `config.env.example` template

- **What**: Added `config.env.example` with placeholder values for every required env var, including the agent service block.
- **Why**: New devs / fresh clones need a template to know which vars to set. The real `config.env` is correctly gitignored and was never committed to history (the cross-cutting audit flagged this as a critical issue but verification with `git ls-files` + `git log --all --diff-filter=A -- config.env` confirmed it was never tracked). Secret rotation is not required.
- **Files**: `config.env.example`
- **Verify**: `cp config.env.example config.env` then fill in values reproduces a working dev environment.

---

## 2026-06-05 — Documentation scaffolding

- **What**: Created `docs/CHANGES.md` (this file) and `docs/AI_CHANGES.md` to track the optimization-pass deliverables.
- **Why**: Source of truth for "what shipped" so the work is auditable after the fact. AI changes split into their own file because the agentic subsystem warrants its own narrative.
- **Files**: `docs/CHANGES.md`, `docs/AI_CHANGES.md`
- **Verify**: Both files exist and are populated.
