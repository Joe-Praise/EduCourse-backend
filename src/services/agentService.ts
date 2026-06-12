import { logger } from '../utils/logger.js';
import axios, { AxiosError } from 'axios';
import { AgentRun } from '../models/agentRunModel.js';

export type AgentType =
  | 'youtube-course-discovery'
  | 'course-summariser'
  | 'course-recommender'
  | 'learning-path-builder'
  | 'quiz-generator'
  | 'progress-nudge'
  | 'review-sentiment-analyzer'
  | 'auto-tagger';

export type AgentEnvironment = 'production' | 'local';

export interface BaseAgentPayload {
  projectId: string;
  initiatedBy: string;
  environment?: AgentEnvironment;
  [key: string]: any;
}

export interface AgentTriggerResponse {
  accepted: boolean;
  projectId: string;
  agentType: string;
  [key: string]: any;
}

// Read env LAZILY (at call time), never as module-load constants. server.ts
// calls dotenv.config() AFTER `import app` (ESM import hoisting), so any
// top-level `process.env.X` here would capture `undefined`. Functions are
// only invoked at request time, long after dotenv has populated process.env.
const agentServiceUrl = (): string =>
  process.env.AGENT_SERVICE_URL || 'http://localhost:4000';
const serviceSecret = (): string | undefined => process.env.AGENT_SERVICE_SECRET;
const projectId = (): string => process.env.AGENT_PROJECT_ID || 'building-safety';

export function getProjectId(): string {
  return projectId();
}

export function getEnvironment(): AgentEnvironment {
  return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}

/**
 * Strip anything that could contain a secret out of an outbound error message
 * before we log/persist it. Axios likes to dump the full URL in errors and
 * if the URL ever carries a token, we leak it.
 */
function sanitizeError(message: string): string {
  return message
    .replace(agentServiceUrl(), '<AGENT_SERVICE_URL>')
    .replace(/X-Service-Secret[^,\s]*/gi, 'X-Service-Secret:<redacted>');
}

export async function triggerAgent(
  agentType: AgentType,
  payload: Omit<BaseAgentPayload, 'projectId'> & { projectId?: string },
): Promise<AgentTriggerResponse> {
  const secret = serviceSecret();
  if (!secret) {
    throw new Error('AGENT_SERVICE_SECRET is not configured');
  }

  const fullPayload = {
    ...payload,
    projectId: payload.projectId || projectId(),
    environment: payload.environment || getEnvironment(),
  } as BaseAgentPayload;

  try {
    const res = await axios.post(
      `${agentServiceUrl()}/agents/${agentType}`,
      fullPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Secret': secret,
        },
        timeout: 10_000,
        validateStatus: (s) => s < 500,
      },
    );

    if (res.status !== 202) {
      throw new Error(
        `Agent trigger failed (${res.status}): ${JSON.stringify(res.data)}`,
      );
    }

    return res.data as AgentTriggerResponse;
  } catch (err) {
    const axErr = err as AxiosError;
    if (axErr.isAxiosError) {
      throw new Error(
        sanitizeError(`Agent service unreachable: ${axErr.message}`),
      );
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
export async function safeTriggerAgent(
  agentType: AgentType,
  payload: Omit<BaseAgentPayload, 'projectId'> & { projectId?: string },
  context: string = '',
): Promise<AgentTriggerResponse | null> {
  // Sanitized payload — no secrets get into the DB
  const safePayload = { ...payload };
  delete (safePayload as Record<string, unknown>).serviceSecret;
  delete (safePayload as Record<string, unknown>).apiKey;

  const run = await AgentRun.create({
    agentType,
    status: 'pending',
    initiatedBy: payload.initiatedBy,
    context,
    payload: safePayload,
  }).catch((dbErr) => {
    // Don't let DB issues block the trigger; just log and continue.
    logger.error(`[agentService] failed to persist AgentRun:`, (dbErr as Error).message);
    return null;
  });

  logger.info(
    `[agent] → dispatching "${agentType}"${context ? ` (${context})` : ''} to agent-service…`,
  );

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
  } catch (err) {
    const message = sanitizeError((err as Error).message);
    logger.error(
      `[agentService] Failed to trigger ${agentType}${context ? ` (${context})` : ''}: ${message}`,
    );
    if (run) {
      run.status = 'failed';
      run.error = message;
      run.completedAt = new Date();
      await run.save().catch(() => undefined);
    }
    return null;
  }
}
