import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import { getEarningsByInstructor, getEarningsSummary, getDashboardOverview, getActivityFeed, getEngagementHeatmap, } from '../Controllers/instructorEarningController.js';
const router = express.Router();
router.use(strictXssSanitizer);
router.use(protect);
router.use(restrictTo(['instructor', 'admin']));
router.route('/').get(getEarningsByInstructor);
router.route('/summary').get(getEarningsSummary);
router.route('/dashboard').get(getDashboardOverview);
router.route('/activity').get(getActivityFeed);
router.route('/engagement').get(getEngagementHeatmap);
export default router;
//# sourceMappingURL=earningRoutes.js.map