import express from 'express';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import { getPlatformStats } from '../Controllers/platformController.js';
const router = express.Router();
router.use(strictXssSanitizer);
// Public — no auth required; powers the landing page StatsBand
router.get('/stats', getPlatformStats);
export default router;
//# sourceMappingURL=platformRoutes.js.map