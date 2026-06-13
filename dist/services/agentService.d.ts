export type AgentType = 'youtube-course-discovery' | 'course-summariser' | 'course-recommender' | 'learning-path-builder' | 'quiz-generator' | 'progress-nudge' | 'review-sentiment-analyzer' | 'auto-tagger';
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
export declare function getProjectId(): string;
export declare function getEnvironment(): AgentEnvironment;
export declare function triggerAgent(agentType: AgentType, payload: Omit<BaseAgentPayload, 'projectId'> & {
    projectId?: string;
}): Promise<AgentTriggerResponse>;
/**
 * Trigger an agent and persist the attempt to AgentRun for observability and
 * retry. Failures are logged at error level (no longer silent) and the run
 * document captures the sanitized error. Returns null on failure so callers
 * can chain without try/catch.
 */
export declare function safeTriggerAgent(agentType: AgentType, payload: Omit<BaseAgentPayload, 'projectId'> & {
    projectId?: string;
}, context?: string): Promise<AgentTriggerResponse | null>;
//# sourceMappingURL=agentService.d.ts.map