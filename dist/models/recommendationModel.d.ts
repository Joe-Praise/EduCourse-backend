import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const recommendationSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    userId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    recommendations: Types.DocumentArray<{
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }> & {
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }>;
    generatedAt: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    userId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    recommendations: Types.DocumentArray<{
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }> & {
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }>;
    generatedAt: NativeDate;
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
    userId: Types.ObjectId;
    status: "failed" | "pending" | "ready";
    recommendations: Types.DocumentArray<{
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }, Types.Subdocument<import("bson").ObjectId, any, {
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }> & {
        courseId: Types.ObjectId;
        reason?: string;
        order?: number;
    }>;
    generatedAt: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type RecommendationType = InferSchemaType<typeof recommendationSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type RecommendationDoc = HydratedDocument<RecommendationType>;
type RecommendationModel = Model<RecommendationType>;
declare const Recommendation: RecommendationModel;
export { Recommendation, RecommendationType, RecommendationDoc, RecommendationModel };
//# sourceMappingURL=recommendationModel.d.ts.map