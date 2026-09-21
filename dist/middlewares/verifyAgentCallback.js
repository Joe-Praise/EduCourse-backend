import { logger } from '../utils/logger.js';
export function verifyAgentCallback(req, res, next) {
    const expected = process.env.AGENT_API_KEY;
    const provided = req.headers['x-agent-api-key'];
    if (!expected) {
        logger.error('[verifyAgentCallback] AGENT_API_KEY not configured');
        res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
        return;
    }
    if (!provided || typeof provided !== 'string' || provided !== expected) {
        res.status(401).json({ status: 'fail', message: 'Unauthorized agent callback' });
        return;
    }
    next();
}
//# sourceMappingURL=verifyAgentCallback.js.map