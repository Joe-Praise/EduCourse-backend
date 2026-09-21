import { logger } from '../utils/logger.js';
import axios from 'axios';
import { AgentRun } from '../models/agentRunModel.js';
// Read env LAZILY (at call time), never as module-load constants. server.ts
// calls dotenv.config() AFTER `import app` (ESM import hoisting), so any
// top-level `process.env.X` here would capture `undefined`. Functions are
// only invoked at request time, long after dotenv has populated process.env.
const agentServiceUrl = () => process.env.AGENT_SERVICE_URL || 'http://localhost:4000';
const serviceSecret = () => process.env.AGENT_SERVICE_SECRET;
const projectId = () => process.env.AGENT_PROJECT_ID || 'building-safety';
export function getProjectId() {
    return projectId();
}
export function getEnvironment() {
    return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}
/**
 * Strip anything that could contain a secret out of an outbound error message
 * before we log/persist it. Axios likes to dump the full URL in errors and
 * if the URL ever carries a token, we leak it.
 */
function sanitizeError(message) {
    return message
        .replace(agentServiceUrl(), '<AGENT_SERVICE_URL>')
        .replace(/X-Service-Secret[^,\s]*/gi, 'X-Service-Secret:<redacted>');
}
export async function triggerAgent(agentType, payload) {
    const secret = serviceSecret();
    if (!secret) {
        throw new Error('AGENT_SERVICE_SECRET is not configured');
    }
    const fullPayload = {
        ...payload,
        projectId: payload.projectId || projectId(),
        environment: payload.environment || getEnvironment(),
    };
    try {
        const res = await axios.post(`${agentServiceUrl()}/agents/${agentType}`, fullPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Secret': secret,
            },
            timeout: 10000,
            validateStatus: (s) => s < 500,
        });
        if (res.status !== 202) {
            throw new Error(`Agent trigger failed (${res.status}): ${JSON.stringify(res.data)}`);
        }
        return res.data;
    }
    catch (err) {
        const axErr = err;
        if (axErr.isAxiosError) {
            throw new Error(sanitizeError(`Agent service unreachable: ${axErr.message}`));
        }
        throw err;
    }
}
/**
 * Trigger an agent and persist the attempt to AgentRun for observability and
 * retry. Failures are logged at error level (no longer silent) and the run
 * document captures the sanitized error. Returns null on failure so callers
 * can chain without try/catch.
 */
export async function safeTriggerAgent(agentType, payload, context = '') {
    // Sanitized payload — no secrets get into the DB
    const safePayload = { ...payload };
    delete safePayload.serviceSecret;
    delete safePayload.apiKey;
    const run = await AgentRun.create({
        agentType,
        status: 'pending',
        initiatedBy: payload.initiatedBy,
        context,
        payload: safePayload,
    }).catch((dbErr) => {
        // Don't let DB issues block the trigger; just log and continue.
        logger.error(`[agentService] failed to persist AgentRun:`, dbErr.message);
        return null;
    });
    logger.info(`[agent] → dispatching "${agentType}"${context ? ` (${context})` : ''} to agent-service…`);
    try {
        const result = await triggerAgent(agentType, payload);
        logger.info(`[agent] ✓ "${agentType}" accepted by agent-service (running async)`);
        if (run) {
            run.status = 'accepted';
            run.response = result;
            run.completedAt = new Date();
            await run.save().catch(() => undefined);
        }
        return result;
    }
    catch (err) {
        const message = sanitizeError(err.message);
        logger.error(`[agentService] Failed to trigger ${agentType}${context ? ` (${context})` : ''}: ${message}`);
        if (run) {
            run.status = 'failed';
            run.error = message;
            run.completedAt = new Date();
            await run.save().catch(() => undefined);
        }
        return null;
    }
}
//# sourceMappingURL=agentService.js.map