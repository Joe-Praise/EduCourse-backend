import catchAsync from '../utils/catchAsync.js';
import { Course } from '../models/courseModel.js';
import { Blog } from '../models/blogModel.js';
export const unifiedSearch = catchAsync(async (req, res, _next) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
        return res.status(200).json({ status: 'success', data: [] });
    }
    const [courses, blogs] = await Promise.all([
        // Atlas $search bypasses Mongoose pre-find middleware, so we re-apply
        // the same filters here: only active + published courses appear.
        Course.aggregate([
            {
                $search: {
                    index: 'courseAutocomplete',
                    autocomplete: {
                        query: q,
                        path: 'title',
                        tokenOrder: 'sequential',
                        fuzzy: {},
                    },
                },
            },
            {
                $match: {
                    active: { $ne: false },
                    publishedStatus: 'published',
                },
            },
            {
                $project: {
                    type: { $literal: 'course' },
                    _id: 1,
                    title: 1,
                    imageCover: 1,
                    slug: 1,
                    level: 1,
                    ratingsAverage: 1,
                    score: { $meta: 'searchScore' },
                },
            },
            { $limit: 10 },
        ]),
        // Blog $text uses Mongoose, but the published-status field doesn't apply
        // there. Active is already filtered.
        Blog.find({ $text: { $search: q }, active: { $ne: false } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .select('title slug imageCover category createdAt')
            .limit(10)
            .lean()
            .then((docs) => docs.map((d) => ({ ...d, type: 'blog' }))),
    ]);
    const results = [...courses, ...blogs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    res.status(200).json({ status: 'success', data: results });
});
//# sourceMappingURL=searchController.js.map