import catchAsync from '../utils/catchAsync.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { User } from '../models/userModel.js';
import { Enrollment } from '../models/enrollmentModel.js';
import { Lesson } from '../models/lessonModel.js';
import { InstructorEarning } from '../models/instructorEarningModel.js';
export const getPlatformStats = catchAsync(async (_req, res) => {
    const cacheKey = CacheKeyBuilder.resourceKey('platform', 'stats');
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    // Use aggregation pipelines to bypass pre-find middleware for clean counts
    const [usersResult, enrollmentsResult, lessonsResult, earningsResult] = await Promise.all([
        User.aggregate([{ $match: { active: { $ne: false } } }, { $count: 'total' }]),
        Enrollment.aggregate([{ $match: { active: { $ne: false } } }, { $count: 'total' }]),
        Lesson.aggregate([{ $count: 'total' }]),
        InstructorEarning.aggregate([
            { $match: { active: { $ne: false } } },
            { $group: { _id: null, total: { $sum: '$netEarning' } } },
        ]),
    ]);
    const stats = {
        totalStudents: usersResult[0]?.total ?? 0,
        totalEnrollments: enrollmentsResult[0]?.total ?? 0,
        totalLessons: lessonsResult[0]?.total ?? 0,
        totalPaidToCreators: Math.round((earningsResult[0]?.total ?? 0) * 100) / 100,
    };
    await cacheManager.set(cacheKey, stats, 3600);
    res.status(200).json({ status: 'success', data: stats });
});
//# sourceMappingURL=platformController.js.map