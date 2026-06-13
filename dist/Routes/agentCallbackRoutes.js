import express from 'express';
import { verifyAgentCallback } from '../middlewares/verifyAgentCallback.js';
import * as cb from '../Controllers/agentCallbackController.js';
const router = express.Router();
router.use(verifyAgentCallback);
router.put('/courses/:id/youtube-import', cb.handleYouTubeImport);
router.put('/courses/:id/summary', cb.handleCourseSummary);
router.put('/courses/:id/tags', cb.handleAutoTags);
router.put('/courses/:id/quiz', cb.handleQuiz);
router.put('/users/:userId/recommendations', cb.handleRecommendations);
router.put('/users/:userId/learning-path', cb.handleLearningPath);
router.put('/users/:userId/nudge', cb.handleProgressNudge);
router.put('/reviews/:id/sentiment', cb.handleReviewSentiment);
export default router;
//# sourceMappingURL=agentCallbackRoutes.js.map