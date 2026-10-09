import express from 'express';
import helmet from 'helmet';
import { mcpLimiter } from '../middlewares/rateLimiter.js';
import { verifyMcpBearer } from '../middlewares/verifyMcpBearer.js';
import { mcpHealth } from '../mcp/edcourseContent/health.js';
import { handleMcpPost, rejectMcpMethod } from '../mcp/edcourseContent/transport.js';
import catchAsync from '../utils/catchAsync.js';

// Mounted at /api/v1/mcp BEFORE the session middleware (machine-to-machine:
// no cookies, no Redis session per call). Auth runs before body parsing.
const router = express.Router();
router.use(helmet());

// Public — process/DB/MCP-configured status only; never content or secrets
router.get('/health', mcpHealth);

router
  .route('/edcourse-content')
  .post(mcpLimiter, verifyMcpBearer, express.json({ limit: '10kb' }), catchAsync(handleMcpPost))
  .get(mcpLimiter, verifyMcpBearer, rejectMcpMethod)
  .delete(mcpLimiter, verifyMcpBearer, rejectMcpMethod);

export default router;
