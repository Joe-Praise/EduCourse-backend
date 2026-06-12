import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import * as ai from '../Controllers/aiTriggerController.js';

const router = express.Router();

router.use(aiLimiter);

router.get('/recommendations',        protect, ai.triggerRecommendations);
router.get('/recommendations/result', protect, ai.getRecommendations);
router.post('/learning-path',         protect, ai.triggerLearningPath);
router.get('/learning-path',          protect, ai.getMyLearningPaths);
router.get('/learning-path/:id',      protect, ai.getLearningPath);

export default router;
