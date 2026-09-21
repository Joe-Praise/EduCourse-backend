import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const learningPathSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    path: Types.DocumentArray<{
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }> & {
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }>;
    userId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    goal: string;
    estimatedWeeks?: number;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    path: Types.DocumentArray<{
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }> & {
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }>;
    userId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    goal: string;
    estimatedWeeks?: number;
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
    path: Types.DocumentArray<{
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }> & {
        courseId: Types.ObjectId;
        order: number;
        reason?: string;
    }>;
    userId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    goal: string;
    estimatedWeeks?: number;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type LearningPathType = InferSchemaType<typeof learningPathSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type LearningPathDoc = HydratedDocument<LearningPathType>;
type LearningPathModel = Model<LearningPathType>;
declare const LearningPath: LearningPathModel;
export { LearningPath, LearningPathType, LearningPathDoc, LearningPathModel };
//# sourceMappingURL=learningPathModel.d.ts.map