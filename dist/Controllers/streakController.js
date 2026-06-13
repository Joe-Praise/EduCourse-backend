import { Types } from 'mongoose';
import catchAsync from '../utils/catchAsync.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CompletedCourse } from '../models/completedcourseModel.js';
import { Enrollment } from '../models/enrollmentModel.js';
import { Review } from '../models/reviewModel.js';
// Compute per-day activity map from CompletedCourse.updatedAt + Enrollment.enrolledAt
async function buildActivityDateMap(userId) {
    const userObjId = new Types.ObjectId(userId);
    const [completionDates, enrollmentDates] = await Promise.all([
        CompletedCourse.aggregate([
            { $match: { userId: userObjId } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
                    count: { $sum: 1 },
                },
            },
        ]),
        Enrollment.aggregate([
            { $match: { userId: userObjId, active: { $ne: false } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    const dateMap = new Map();
    for (const d of [...completionDates, ...enrollmentDates]) {
        dateMap.set(d._id, (dateMap.get(d._id) ?? 0) + d.count);
    }
    return dateMap;
}
function computeStreaks(dateMap) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Current streak: count backwards from today
    let currentStreak = 0;
    const check = new Date(today);
    while (dateMap.has(check.toISOString().slice(0, 10))) {
        currentStreak++;
        check.setDate(check.getDate() - 1);
    }
    // Longest streak: scan all sorted dates
    const sortedDates = [...dateMap.keys()].sort();
    let longestStreak = 0;
    let run = 0;
    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
            run = 1;
        }
        else {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
            run = diffDays === 1 ? run + 1 : 1;
        }
        if (run > longestStreak)
            longestStreak = run;
    }
    return { currentStreak, longestStreak };
}
export const getLearningStreak = catchAsync(async (req, res, _next) => {
    const userId = req.query.userId ?? req.user._id;
    const cacheKey = CacheKeyBuilder.resourceKey('user-streak', userId);
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    const dateMap = await buildActivityDateMap(userId);
    const { currentStreak, longestStreak } = computeStreaks(dateMap);
    // Build 91-day window (13 weeks) for the heatmap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 90; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        days.push({ date: dateStr, count: dateMap.get(dateStr) ?? 0 });
    }
    const result = { days, currentStreak, longestStreak };
    await cacheManager.set(cacheKey, result, 300);
    res.status(200).json({ status: 'success', data: result });
});
export const getUserBadges = catchAsync(async (req, res, _next) => {
    const userId = req.query.userId ?? req.user._id;
    const cacheKey = CacheKeyBuilder.resourceKey('user-badges', userId);
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    const userObjId = new Types.ObjectId(userId);
    const [enrollments, reviews, completions, dateMap] = await Promise.all([
        Enrollment.aggregate([
            { $match: { userId: userObjId, active: { $ne: false } } },
            { $count: 'total' },
        ]),
        Review.aggregate([{ $match: { userId: userObjId } }, { $count: 'total' }]),
        CompletedCourse.aggregate([
            { $match: { userId: userObjId, completed: true } },
            { $count: 'total' },
        ]),
        buildActivityDateMap(userId),
    ]);
    const enrollmentCount = enrollments[0]?.total ?? 0;
    const reviewCount = reviews[0]?.total ?? 0;
    const completionCount = completions[0]?.total ?? 0;
    const { currentStreak } = computeStreaks(dateMap);
    const badges = [
        {
            id: 'first-course',
            name: 'First steps',
            description: 'Enrolled in your first course',
            earned: enrollmentCount >= 1,
        },
        {
            id: 'streak-7',
            name: 'Week one',
            description: '7-day learning streak',
            earned: currentStreak >= 7,
        },
        {
            id: 'first-review',
            name: 'First word',
            description: 'Left your first review',
            earned: reviewCount >= 1,
        },
        {
            id: 'first-complete',
            name: 'Finisher',
            description: 'Completed your first course',
            earned: completionCount >= 1,
        },
        {
            id: 'streak-30',
            name: 'Month deep',
            description: '30-day learning streak',
            earned: currentStreak >= 30,
        },
        {
            id: 'connector',
            name: 'Connector',
            description: 'Enrolled in 10 courses',
            earned: enrollmentCount >= 10,
        },
        {
            id: 'mastery',
            name: 'Mastery',
            description: 'Completed 5 courses',
            earned: completionCount >= 5,
        },
        {
            id: 'top',
            name: 'Top of class',
            description: 'Completed 10 or more courses',
            earned: completionCount >= 10,
        },
    ];
    await cacheManager.set(cacheKey, badges, 300);
    res.status(200).json({ status: 'success', data: badges });
});
//# sourceMappingURL=streakController.js.map