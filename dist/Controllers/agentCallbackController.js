import { logger } from '../utils/logger.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { appEvents } from '../events/index.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { safeTriggerAgent } from '../services/agentService.js';
import { Course } from '../models/courseModel.js';
import { CourseModule } from '../models/courseModuleModel.js';
import { Lesson } from '../models/lessonModel.js';
import { Instructor } from '../models/instructorModel.js';
import { Review } from '../models/reviewModel.js';
import { Notification } from '../models/notificationModel.js';
import { Recommendation } from '../models/recommendationModel.js';
import { LearningPath } from '../models/learningPathModel.js';
import { Quiz } from '../models/quizModel.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Format seconds as "HH:MM:SS" or "MM:SS". */
function formatDuration(seconds) {
    if (!seconds || seconds <= 0)
        return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
async function upsertYouTubeInstructor(channelId, channelName, enrichment = {}) {
    const existing = await Instructor.findOne({ channelId }).setOptions({
        skipPublishedFilter: true,
    });
    if (existing) {
        // Backfill profile fields if this channel was imported before enrichment
        // existed (or if YouTube returned richer data this time).
        let dirty = false;
        if (enrichment.avatarUrl && !existing.channelThumbnailUrl) {
            existing.channelThumbnailUrl = enrichment.avatarUrl;
            dirty = true;
        }
        if (enrichment.customUrl && !existing.channelUrl) {
            existing.channelUrl = enrichment.customUrl;
            dirty = true;
        }
        if (typeof enrichment.subscriberCount === 'number' && !existing.subscriberCount) {
            existing.subscriberCount = enrichment.subscriberCount;
            dirty = true;
        }
        if (enrichment.bio && (!existing.description || existing.description.startsWith('YouTube channel:'))) {
            existing.description = enrichment.bio;
            dirty = true;
        }
        if (dirty)
            await existing.save();
        return existing._id.toString();
    }
    const created = await Instructor.create({
        channelId,
        channelName,
        source: 'youtube',
        title: channelName,
        description: enrichment.bio || `YouTube channel: ${channelName}`,
        expertise: 'Online Courses',
        channelThumbnailUrl: enrichment.avatarUrl,
        channelUrl: enrichment.customUrl,
        subscriberCount: enrichment.subscriberCount,
    });
    appEvents.emit(CacheEvent.INSTRUCTOR.CREATED, created);
    return created._id.toString();
}
async function importCourseFromYouTube(data, existingCourseId, importQuery) {
    const instructorId = await upsertYouTubeInstructor(data.channelId, data.instructor, {
        avatarUrl: data.instructorAvatarUrl,
        bio: data.instructorBio,
        customUrl: data.instructorCustomUrl,
        subscriberCount: data.subscriberCount,
    });
    const totalLessons = data.modules.reduce((sum, m) => sum + m.videos.length, 0);
    const courseFields = {
        title: data.title,
        description: data.description,
        imageCover: data.thumbnailUrl || undefined,
        channelId: data.channelId,
        youtubePlaylistId: data.youtubePlaylistId,
        aiInstructor: data.instructor,
        instructors: [instructorId],
        videoCount: data.videoCount,
        totalLessons,
        publishedStatus: 'published',
        publishedAt: new Date(),
        importQuery,
    };
    let courseId;
    if (existingCourseId) {
        const updated = await Course.findByIdAndUpdate(existingCourseId, courseFields, { new: true, runValidators: true }).setOptions({ skipPublishedFilter: true });
        if (!updated)
            throw new Error(`Course ${existingCourseId} not found`);
        courseId = existingCourseId;
        appEvents.emit(CacheEvent.COURSE.UPDATED, updated);
    }
    else {
        const created = await Course.create({
            ...courseFields,
            priceCategory: 'Free',
        });
        courseId = created._id.toString();
        appEvents.emit(CacheEvent.COURSE.CREATED, created);
    }
    // Build modules + lessons
    for (const mod of data.modules) {
        const courseModule = await CourseModule.create({
            courseId,
            title: mod.title,
            moduleIndex: mod.moduleIndex,
            section: `Module ${mod.moduleIndex}`,
        });
        const lessons = mod.videos.map((v, idx) => ({
            moduleId: courseModule._id,
            courseId,
            url: `https://www.youtube.com/watch?v=${v.videoId}`,
            title: v.title,
            duration: formatDuration(v.durationSeconds),
            lessonIndex: idx + 1,
        }));
        await Lesson.insertMany(lessons);
    }
    return courseId;
}
// ---------------------------------------------------------------------------
// handleYouTubeImport
// PUT /api/v1/admin/courses/:id/youtube-import
// ---------------------------------------------------------------------------
export const handleYouTubeImport = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const body = req.body;
    if (!body.courses || !Array.isArray(body.courses) || body.courses.length === 0) {
        return next(new AppError('courses array is required in callback payload', 400));
    }
    const importQuery = body.courseQuery ?? '';
    const importedIds = [];
    logger.info(`[import] ← YouTube callback for course ${id}: ${body.courses.length} course(s) discovered for "${importQuery}"`);
    const failures = [];
    for (let i = 0; i < body.courses.length; i++) {
        const courseData = body.courses[i];
        // First course updates the original draft; subsequent courses are new docs
        const targetId = i === 0 ? id : null;
        try {
            const courseId = await importCourseFromYouTube(courseData, targetId, importQuery);
            importedIds.push(courseId);
            const lessonCount = courseData.modules.reduce((s, m) => s + m.videos.length, 0);
            logger.info(`[import] ✓ "${courseData.title}" → ${courseId} (${courseData.modules.length} modules, ${lessonCount} lessons)`);
            // Chain: summariser + tagger for each imported course (non-blocking).
            // Pass the course content as context so the agents don't need a
            // separate authenticated GET back into us.
            const lessonTitles = courseData.modules.flatMap((m) => m.videos.map((v) => v.title));
            const moduleTitles = courseData.modules.map((m) => m.title);
            const summariserContext = {
                title: courseData.title,
                description: courseData.description,
                lessonTitles,
                moduleTitles,
            };
            safeTriggerAgent('course-summariser', {
                courseId,
                initiatedBy: 'agent:youtube-course-discovery',
                context: summariserContext,
            });
            safeTriggerAgent('auto-tagger', {
                courseId,
                initiatedBy: 'agent:youtube-course-discovery',
                context: { title: courseData.title, description: courseData.description, lessonTitles },
            });
        }
        catch (err) {
            const reason = err.message;
            failures.push(`course ${i} ("${courseData.title}"): ${reason}`);
            logger.error(`[import] ✗ failed to import course index ${i} ("${courseData.title}"): ${reason}`);
        }
    }
    if (importedIds.length === 0) {
        // Surface the actual per-course reason(s) instead of a blank "all failed".
        return next(new AppError(`All courses in the callback payload failed to import — ${failures.join(' | ')}`, 500));
    }
    // Invalidate every cached course list/query variant so the newly published
    // course shows up immediately on the next courses-page fetch (the per-key
    // list helpers can't reach the query-hashed list keys).
    await cacheManager.removePattern(CacheKeyBuilder.pattern('course'));
    logger.info(`[import] ✔ done — ${importedIds.length} course(s) published for "${importQuery}" (course cache invalidated)`);
    res.status(200).json({ ok: true, imported: importedIds.length, courseIds: importedIds });
});
// ---------------------------------------------------------------------------
// handleCourseSummary
// PUT /api/v1/admin/courses/:id/summary
// ---------------------------------------------------------------------------
export const handleCourseSummary = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { difficulty, prerequisites, willBuild, summary } = req.body;
    const course = await Course.findByIdAndUpdate(id, { aiSummary: { difficulty, prerequisites, willBuild, summary } }, { new: true, runValidators: false }).setOptions({ skipPublishedFilter: true });
    if (!course)
        return next(new AppError('Course not found', 404));
    appEvents.emit(CacheEvent.COURSE.UPDATED, course);
    res.status(200).json({ ok: true });
});
// ---------------------------------------------------------------------------
// handleAutoTags
// PUT /api/v1/admin/courses/:id/tags
// ---------------------------------------------------------------------------
export const handleAutoTags = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { category: categoryName, tags } = req.body;
    const course = await Course.findById(id).setOptions({
        skipPublishedFilter: true,
    });
    if (!course)
        return next(new AppError('Course not found', 404));
    const update = {};
    if (Array.isArray(tags))
        update.aiTags = tags;
    // Attach a course category from the agent-supplied name if the course has
    // none yet. We upsert (create-if-missing) rather than only matching an
    // existing category, so every imported course ends up filterable by
    // category instead of silently category-less. Match is case-insensitive on
    // an escaped name to avoid duplicate categories that differ only by case.
    if (categoryName && !course.category) {
        const { Category } = await import('../models/categoryModel.js');
        const name = categoryName.trim();
        if (name) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const cat = await Category.findOneAndUpdate({ name: new RegExp(`^${escaped}$`, 'i'), group: 'course' }, { $setOnInsert: { name, group: 'course' } }, { new: true, upsert: true, setDefaultsOnInsert: true });
            update.category = cat._id;
            // Invalidate the category list cache so the (possibly new) category
            // shows up as a filter option on the next categories fetch.
            appEvents.emit(CacheEvent.CATEGORY.CREATED, cat);
        }
    }
    const updated = await Course.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: false,
    }).setOptions({ skipPublishedFilter: true });
    appEvents.emit(CacheEvent.COURSE.UPDATED, updated);
    res.status(200).json({ ok: true });
});
// ---------------------------------------------------------------------------
// handleRecommendations
// PUT /api/v1/admin/users/:userId/recommendations
// ---------------------------------------------------------------------------
export const handleRecommendations = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { recommendations } = req.body;
    if (!Array.isArray(recommendations)) {
        return next(new AppError('recommendations array is required', 400));
    }
    const doc = await Recommendation.findOneAndUpdate({ userId }, {
        userId,
        recommendations: recommendations.map((r, i) => ({
            courseId: r.courseId,
            reason: r.reason ?? '',
            order: r.order ?? i + 1,
        })),
        generatedAt: new Date(),
        status: 'ready',
    }, { upsert: true, new: true });
    // Warm Redis cache (1-hour TTL)
    await cacheManager.set(`ai:recommendations:${userId}`, doc.recommendations, 3600);
    res.status(200).json({ ok: true });
});
// ---------------------------------------------------------------------------
// handleLearningPath
// PUT /api/v1/admin/users/:userId/learning-path
// ---------------------------------------------------------------------------
export const handleLearningPath = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { goal, path, estimatedWeeks, learningPathId } = req.body;
    if (!goal || !Array.isArray(path)) {
        return next(new AppError('goal and path are required', 400));
    }
    // If the trigger created a pending doc and passed back the ID, hydrate
    // that one rather than creating a new doc — keeps the user's "pending"
    // expectation in sync with the final "ready" result.
    if (learningPathId) {
        const existing = await LearningPath.findById(learningPathId);
        if (existing) {
            existing.path = path;
            existing.estimatedWeeks = estimatedWeeks;
            existing.status = 'ready';
            await existing.save();
        }
        else {
            await LearningPath.create({ userId, goal, path, estimatedWeeks, status: 'ready' });
        }
    }
    else {
        await LearningPath.create({ userId, goal, path, estimatedWeeks, status: 'ready' });
    }
    // Invalidate any cached learning-path list for this user
    await cacheManager.remove(`ai:learning-path:${userId}`);
    res.status(200).json({ ok: true });
});
// ---------------------------------------------------------------------------
// handleQuiz
// PUT /api/v1/admin/courses/:id/quiz
// ---------------------------------------------------------------------------
export const handleQuiz = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { moduleIndex, questions } = req.body;
    if (!moduleIndex || !Array.isArray(questions)) {
        return next(new AppError('moduleIndex and questions are required', 400));
    }
    await Quiz.findOneAndUpdate({ courseId: id, moduleIndex }, { courseId: id, moduleIndex, questions, generatedAt: new Date(), status: 'ready' }, { upsert: true, new: true });
    await cacheManager.remove(`quiz:${id}:${moduleIndex}`);
    res.status(200).json({ ok: true });
});
// ---------------------------------------------------------------------------
// handleProgressNudge
// PUT /api/v1/admin/users/:userId/nudge
// ---------------------------------------------------------------------------
export const handleProgressNudge = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { message, courseId } = req.body;
    if (!message)
        return next(new AppError('message is required', 400));
    const notification = await Notification.create({
        userId,
        type: 'progress_nudge',
        title: 'Keep Learning!',
        message,
        link: courseId ? `/courses/${courseId}` : '/dashboard',
    });
    appEvents.emit(CacheEvent.NOTIFICATION.CREATED, notification);
    res.status(200).json({ ok: true });
});
// ---------------------------------------------------------------------------
// handleReviewSentiment
// PUT /api/v1/admin/reviews/:id/sentiment
// ---------------------------------------------------------------------------
const NEGATIVE_SENTIMENT_THRESHOLD = 3;
const NEGATIVE_SENTIMENT_WINDOW_DAYS = 7;
export const handleReviewSentiment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { sentiment, flagged, moderationNote } = req.body;
    const review = await Review.findByIdAndUpdate(id, { sentiment, flagged, moderationNote }, { new: true, runValidators: false });
    if (!review)
        return next(new AppError('Review not found', 404));
    const reviewCourseId = review.courseId;
    if (!reviewCourseId) {
        // Review with no courseId is data-integrity broken; emit event so the
        // sentiment update isn't dropped silently, then bail.
        appEvents.emit(CacheEvent.REVIEW.UPDATED, review);
        return res.status(200).json({ ok: true });
    }
    appEvents.emit(CacheEvent.REVIEW.UPDATED, review);
    // If negative, count recent negatives on this course — alert instructor
    if (sentiment === 'negative') {
        const windowStart = new Date(Date.now() - NEGATIVE_SENTIMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const negativeCount = await Review.countDocuments({
            courseId: reviewCourseId,
            sentiment: 'negative',
            createdAt: { $gte: windowStart },
        });
        if (negativeCount >= NEGATIVE_SENTIMENT_THRESHOLD) {
            const course = await Course.findById(reviewCourseId).setOptions({
                skipPublishedFilter: true,
            });
            if (!course) {
                // Course was deleted / archived — nothing to notify on.
                return res.status(200).json({ ok: true });
            }
            const courseRecord = course;
            const instructorId = courseRecord.instructors?.[0];
            if (instructorId) {
                // Notification.userId must reference a real User. Resolve the
                // instructor's linked platform user; YouTube instructors have none,
                // so there's nobody to alert — skip rather than create a dangling
                // notification pointing at an Instructor _id.
                const instructorDoc = await Instructor.findById(instructorId).setOptions({
                    skipPublishedFilter: true,
                });
                const linkedUser = instructorDoc?.userId;
                const targetUserId = linkedUser?._id ?? linkedUser;
                if (targetUserId) {
                    const notification = await Notification.create({
                        userId: targetUserId,
                        type: 'review_alert',
                        title: 'Negative Review Alert',
                        message: `Your course "${courseRecord.title ?? 'Untitled'}" has received ${negativeCount} negative reviews in the past ${NEGATIVE_SENTIMENT_WINDOW_DAYS} days.`,
                        link: courseRecord.slug ? `/courses/${courseRecord.slug}` : '/',
                    });
                    appEvents.emit(CacheEvent.NOTIFICATION.CREATED, notification);
                }
            }
        }
    }
    res.status(200).json({ ok: true });
});
//# sourceMappingURL=agentCallbackController.js.map