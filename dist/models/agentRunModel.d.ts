import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
/**
 * Persists every outbound agent trigger attempt so we can:
 *   1. See which agents fired vs failed without scanning logs.
 *   2. Retry failed runs from a worker.
 *   3. Audit who initiated what.
 *
 * Stored payload is sanitized — secrets/headers are stripped at the call site
 * by `agentService.ts` before writing. Never log raw secrets into this model.
 */
declare const agentRunSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    context: string;
    agentType: "youtube-course-discovery" | "course-summariser" | "course-recommender" | "learning-path-builder" | "quiz-generator" | "progress-nudge" | "review-sentiment-analyzer" | "auto-tagger";
    status: "failed" | "pending" | "accepted";
    payload: any;
    error?: string;
    initiatedBy?: string;
    response?: any;
    completedAt?: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    context: string;
    agentType: "youtube-course-discovery" | "course-summariser" | "course-recommender" | "learning-path-builder" | "quiz-generator" | "progress-nudge" | "review-sentiment-analyzer" | "auto-tagger";
    status: "failed" | "pending" | "accepted";
    payload: any;
    error?: string;
    initiatedBy?: string;
    response?: any;
    completedAt?: NativeDate;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    context: string;
    agentType: "youtube-course-discovery" | "course-summariser" | "course-recommender" | "learning-path-builder" | "quiz-generator" | "progress-nudge" | "review-sentiment-analyzer" | "auto-tagger";
    status: "failed" | "pending" | "accepted";
    payload: any;
    error?: string;
    initiatedBy?: string;
    response?: any;
    completedAt?: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type AgentRunType = InferSchemaType<typeof agentRunSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type AgentRunDoc = HydratedDocument<AgentRunType>;
type AgentRunModel = Model<AgentRunType>;
declare const AgentRun: AgentRunModel;
export { AgentRun, AgentRunType, AgentRunDoc, AgentRunModel };
//# sourceMappingURL=agentRunModel.d.ts.map