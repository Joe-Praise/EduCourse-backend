import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const reviewSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    review: string;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    rating: number;
    flagged: boolean;
    sentiment?: "positive" | "negative" | "neutral";
    moderationNote?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    review: string;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    rating: number;
    flagged: boolean;
    sentiment?: "positive" | "negative" | "neutral";
    moderationNote?: string;
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
    review: string;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    rating: number;
    flagged: boolean;
    sentiment?: "positive" | "negative" | "neutral";
    moderationNote?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type ReviewType = InferSchemaType<typeof reviewSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface ReviewMethods {
    isPositive(this: ReviewDoc): boolean;
    getFormattedRating(this: ReviewDoc): string;
}
/**
 * Statics
 */
interface ReviewStatics {
    calcAverageRatings(this: ReviewModel, courseId: string): Promise<void>;
    findByCourse(this: ReviewModel, courseId: string): Promise<ReviewDoc[]>;
    findByUser(this: ReviewModel, userId: string): Promise<ReviewDoc[]>;
}
type ReviewDoc = HydratedDocument<ReviewType, ReviewMethods>;
type ReviewModel = Model<ReviewType, {}, ReviewMethods> & ReviewStatics;
declare const Review: ReviewModel;
export { Review, ReviewType, ReviewDoc, ReviewModel };
//# sourceMappingURL=reviewModel.d.ts.map