# API Reference

Building Safety Project REST API. All endpoints served under `/api/v1/`.

**Authentication**: JWT via `Authorization: Bearer <token>` header OR `jwt` httpOnly cookie. Endpoints marked 🔒 require auth. 👤 require a specific role (`user`, `instructor`, `admin`).

**Response envelope**:
```json
{ "status": "success" | "fail" | "error", "data": <payload> | null, "metaData": <pagination?> }
```

**Error envelope**:
```json
{ "status": "fail" | "error", "message": "human-readable description" }
```

**Pagination defaults**: page 1, limit 6. Override via `?page=N&limit=N`. List responses include `metaData: { totalPages, totalDocuments, count, page, limit }`.

**Rate limits**: 1000 req / 15 min globally · 5 req / 15 min on auth routes · 10 req / 1 min on `/ai/*`.

---

## Auth & Users — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/signup` | — | Create account. Returns JWT + user. |
| POST | `/users/login` | — | Sign in. Returns JWT, sets cookie + session. |
| GET | `/users/logout` | — | Clear cookie + session. |
| POST | `/users/forgotPassword` | — | Send reset email (Resend). |
| PATCH | `/users/resetPassword/:token` | — | Apply new password using reset token. |
| PATCH | `/users/updatePassword` | 🔒 | Change password for authenticated user. |
| GET | `/users/me` | 🔒 | Current authenticated user. |
| PATCH | `/users/updateMe` | 🔒 | Update name / email / photo (multipart). |
| DELETE | `/users/deleteMe` | 🔒 | Soft-delete current user. |
| GET | `/users/:userId/profile` | — | Public profile — user info + their courses (if instructor) or enrolled courses. |
| GET | `/users/streak` | 🔒 | Learning streak heatmap (91 days). |
| GET | `/users/badges` | 🔒 | User's earned/locked badges. |
| GET | `/users` | 🔒 👤 admin | List all users (paginated). |
| GET | `/users/:id` | 🔒 👤 admin | Get specific user. |
| PATCH | `/users/:id` | 🔒 👤 admin | Update user (non-password fields). |
| DELETE | `/users/:id` | 🔒 👤 admin | Soft-delete user. |

## Courses — `/courses`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/courses` | — | List published courses, filterable. |
| GET | `/courses?slug=<slug>` | — | Look up by slug (single course). |
| GET | `/courses/:id` | — | Get one course by id (handler factory). |
| GET | `/courses/autocomplete` | — | Atlas-Search-backed title autocomplete. |
| POST | `/courses` | 🔒 👤 instructor/admin | Create course (multipart, with cover image). |
| PATCH | `/courses/:id` | 🔒 👤 instructor/admin | Update course. |
| DELETE | `/courses/:id` | 🔒 👤 admin | Soft-delete. |
| GET | `/courses/learn/:userId/:courseId` | 🔒 | Lecture view — must be enrolled. 403 otherwise. |
| GET | `/courses/mylearning:userId` | 🔒 | User's registered courses (enrolled or completed). |

## Modules, Lessons, Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST/PATCH/DELETE | `/modules` | mixed | CRUD on course modules. |
| GET/POST/PATCH/DELETE | `/lessons` | mixed | CRUD on lessons. |
| GET/POST/PATCH/DELETE | `/reviews` | mixed | Course reviews — one per user per course (compound unique index). |
| GET/POST/PATCH/DELETE | `/comments` | mixed | Blog comments. |

## Categories, Tags, Links

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/category` | — | List categories. Supports `?group=course|blog`. |
| POST/PATCH/DELETE | `/category` | 🔒 👤 admin | Manage categories. |
| GET/POST/PATCH/DELETE | `/tags` | mixed | Tag CRUD. |
| GET/POST/PATCH/DELETE | `/links` | 🔒 | Social/profile links per instructor. |

## Blog — `/blogs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/blogs` | — | List blogs (paginated). |
| GET | `/blogs?slug=<slug>` | — | Get by slug. |
| GET/POST/PATCH/DELETE | `/blogs` (+`/:id`) | mixed | Standard CRUD via handler factory. |
| GET | `/blogs/autocomplete` | — | Title autocomplete. |

## Instructors — `/instructors`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/instructors` | — | List instructors. |
| POST | `/instructors` | 🔒 👤 instructor/admin | Create instructor profile. |
| GET | `/instructors/:id` | — | Get instructor. |
| PATCH | `/instructors/updateMe` | 🔒 👤 instructor/admin | Update own profile. |
| DELETE | `/instructors/deleteMe` | 🔒 👤 instructor/admin | Soft-delete own profile. |
| DELETE | `/instructors/:id/suspendInstructor` | 🔒 👤 admin | Admin suspension. |
| GET | `/instructors/myLearningInstructors/:userId` | 🔒 | Instructors of courses the user has registered for. |

## Completed Courses — `/completed-courses`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/completed-courses` | 🔒 | Current user's progress records. |
| GET | `/completed-courses/active/course?courseId=&userId=` | 🔒 | Specific enrollment record. |
| POST | `/completed-courses` | 🔒 | Mark lesson(s) complete. |

## Enrollments — `/enrollments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/enrollments` | 🔒 | Enroll in a course. |
| GET | `/enrollments/check?userId=&courseId=` | 🔒 | Is user enrolled? |
| GET | `/enrollments/user/:userId` | 🔒 | All enrollments for a user. |

## Wishlist — `/wishlist`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/wishlist?userId=&page=N` | 🔒 | Paginated wishlist for a user. |
| POST | `/wishlist` `{userId,courseId}` | 🔒 | Add to wishlist. 409 if already enrolled OR already wishlisted. |
| DELETE | `/wishlist/:id` | 🔒 | Remove a wishlist record (id, not courseId). |
| GET | `/wishlist/check?userId=&courseId=` | 🔒 | Returns `{ wishlisted: bool, wishlistId: string\|null }`. |

## Notifications — `/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | 🔒 | Current user's notifications. |
| PATCH | `/notifications/:id/read` | 🔒 | Mark single notification read. |
| PATCH | `/notifications/read-all` | 🔒 | Mark all read. |
| DELETE | `/notifications/:id` | 🔒 | Soft-delete. |

Types: `enrollment`, `review`, `review_alert`, `course_published`, `earning`, `progress_nudge`, `system`.

## Earnings — `/earnings`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/earnings` | 🔒 👤 instructor | Aggregate dashboard stats. |
| GET | `/earnings/activity` | 🔒 👤 instructor | Time-ordered activity feed. |
| GET | `/earnings/engagement` | 🔒 👤 instructor | 7×24 engagement heatmap. |

## Search — `/search`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search?q=...&type=courses\|blogs\|instructors` | — | Atlas-Search global search. |

## Certificates — `/certificates`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/certificates/user/:userId` | 🔒 | User's earned certificates. |
| GET | `/certificates/:id` | 🔒 | Single certificate detail. |
| POST | `/certificates/issue` | 🔒 | Issue a certificate (triggered on course completion). |

## Platform stats — `/platform`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/platform/stats` | — | Public aggregate (total students, total enrollments, total lessons, total paid to creators). 1h cache. |

## AI subsystem — `/ai`

All `/ai/*` triggers are rate-limited 10 req/min via `aiLimiter`. They synchronously upsert a `pending` doc, fire-and-forget the agent service, and respond `202`. Clients poll the `get*` endpoint and read `generationStatus`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/recommendations/trigger` | 🔒 | Fire course-recommender. |
| GET | `/ai/recommendations` | 🔒 | Returns `{ data, generationStatus: 'pending'\|'ready'\|'failed'\|'not_requested' }`. |
| POST | `/ai/learning-path/trigger` `{goal}` | 🔒 | Fire learning-path-builder. Returns the new pending `learningPathId`. |
| GET | `/ai/learning-path/:id` | 🔒 | Single learning path with `generationStatus`. |
| GET | `/ai/learning-path/mine` | 🔒 | Current user's paths. |
| POST | `/ai/quiz/:id/:moduleIndex/trigger` | 🔒 | Fire quiz-generator. |
| GET | `/ai/quiz/:id/:moduleIndex` | 🔒 | Quiz with `generationStatus`. |
| POST | `/ai/youtube/import` `{playlistId|channelId}` | 🔒 👤 admin | Fire youtube-course-discovery. |

## AI callbacks — `/admin`

Inbound webhooks from the external agent service. Auth via `X-API-Key` header validated by `verifyAgentCallback` middleware against `AGENT_API_KEY` env var.

| Method | Path | Description |
|---|---|---|
| PUT | `/admin/users/:userId/recommendations` | Receive recommendations payload, mark Recommendation `ready`. |
| PUT | `/admin/users/:userId/learning-path` | Receive learning path; updates pending doc by `learningPathId` if provided. |
| PUT | `/admin/courses/:id/quiz` | Receive quiz questions, mark Quiz `ready`. |
| PUT | `/admin/users/:userId/nudge` | Create progress_nudge Notification. |
| PUT | `/admin/reviews/:id/sentiment` | Update review sentiment, escalate if threshold exceeded. |
| PUT | `/admin/courses/:id/summary` | Apply auto-summary. |
| PUT | `/admin/courses/:id/tags` | Apply auto-tags. |
| POST | `/admin/youtube-import-result` | Upsert imported course + chain summariser + tagger. |

---

## Landing page — `/`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/` | — | Bundle for the landing page: top courses, top blogs, instructors (4), categories (7). 5-min Redis cache. |

---

## Notes for integrators

- **Soft delete**: most resources use `active: Boolean` with a `select: false` and a pre-find filter. `DELETE` endpoints set `active: false`; they do not remove the document.
- **Atlas Search**: course + blog autocomplete uses MongoDB Atlas Search indexes maintained outside the codebase. Title field changes require index updates.
- **Caching**: Many GET endpoints use Redis (TTL 5 min by default, 1 hour for AI recommendations, 1 hour for `/platform/stats`). Cache invalidates on the matching POST/PATCH/DELETE via the `events/cache/` event listeners.
- **AI subsystem**: requires `AGENT_SERVICE_URL`, `AGENT_SERVICE_SECRET`, `AGENT_API_KEY`, `AGENT_PROJECT_ID` env vars. When unset, triggers return 503 and persist `failed` in the `AgentRun` collection — see [AI_CHANGES.md](AI_CHANGES.md).
