import { Schema, model, } from 'mongoose';
const AGENT_TYPES = [
    'youtube-course-discovery',
    'course-summariser',
    'course-recommender',
    'learning-path-builder',
    'quiz-generator',
    'progress-nudge',
    'review-sentiment-analyzer',
    'auto-tagger',
];
const AGENT_STATUSES = ['pending', 'accepted', 'failed'];
/**
 * Persists every outbound agent trigger attempt so we can:
 *   1. See which agents fired vs failed without scanning logs.
 *   2. Retry failed runs from a worker.
 *   3. Audit who initiated what.
 *
 * Stored payload is sanitized — secrets/headers are stripped at the call site
 * by `agentService.ts` before writing. Never log raw secrets into this model.
 */
const agentRunSchema = new Schema({
    agentType: {
        type: String,
        enum: { values: AGENT_TYPES, message: 'Invalid agentType' },
        required: true,
    },
    status: {
        type: String,
        enum: { values: AGENT_STATUSES, message: 'Invalid status' },
        default: 'pending',
        required: true,
    },
    // Descriptive origin string, NOT a user ref — callers pass values like
    // 'api', 'user:<id>', or 'agent:youtube-course-discovery'. (Was an
    // ObjectId ref, which silently CastError'd every create → 0 docs persisted.)
    initiatedBy: {
        type: String,
    },
    context: {
        type: String,
        default: '',
    },
    payload: {
        type: Schema.Types.Mixed,
        default: {},
    },
    response: {
        type: Schema.Types.Mixed,
    },
    error: {
        type: String,
    },
    completedAt: {
        type: Date,
    },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
agentRunSchema.index({ agentType: 1, status: 1, createdAt: -1 });
agentRunSchema.index({ initiatedBy: 1, createdAt: -1 });
const AgentRun = model('AgentRun', agentRunSchema);
export { AgentRun };
//# sourceMappingURL=agentRunModel.js.map