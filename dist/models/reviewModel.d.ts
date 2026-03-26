import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const reviewSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}, {
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    rating: number;
    review: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    rating: number;
    review: string;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    rating: number;
    review: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type ReviewType = InferSchemaType<typeof reviewSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface ReviewMethods {
    isPositive(this: ReviewDoc): boolean;
    getFormattedRating(this: ReviewDoc): string;
}
/**
 * 4. Define statics
 */
interface ReviewStatics {
    calcAverageRatings(this: ReviewModel, courseId: string): Promise<void>;
    findByCourse(this: ReviewModel, courseId: string): Promise<ReviewDoc[]>;
    findByUser(this: ReviewModel, userId: string): Promise<ReviewDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type ReviewDoc = HydratedDocument<ReviewType, ReviewMethods>;
type ReviewModel = Model<ReviewType, {}, ReviewMethods> & ReviewStatics;
/**
 * 10. Export model
 */
declare const Review: ReviewModel;
export { Review, ReviewType, ReviewDoc, ReviewModel };
//# sourceMappingURL=reviewModel.d.ts.map