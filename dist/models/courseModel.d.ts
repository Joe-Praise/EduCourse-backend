import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const courseSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}, {
    createdAt: NativeDate;
    active: boolean;
    description: string;
    title: string;
    instructors: Types.ObjectId[];
    category: Types.ObjectId;
    duration: string;
    ratingsAverage: number;
    ratingSummary: number[];
    ratingsQuantity: number;
    price: number;
    priceCategory: "Free" | "Paid";
    studentsQuantity: number;
    slug?: string;
    imageCover?: string;
    level?: "All Levels";
    totalLessons?: number;
    priceDiscount?: number;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    description: string;
    title: string;
    instructors: Types.ObjectId[];
    category: Types.ObjectId;
    duration: string;
    ratingsAverage: number;
    ratingSummary: number[];
    ratingsQuantity: number;
    price: number;
    priceCategory: "Free" | "Paid";
    studentsQuantity: number;
    slug?: string;
    imageCover?: string;
    level?: "All Levels";
    totalLessons?: number;
    priceDiscount?: number;
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
    description: string;
    title: string;
    instructors: Types.ObjectId[];
    category: Types.ObjectId;
    duration: string;
    ratingsAverage: number;
    ratingSummary: number[];
    ratingsQuantity: number;
    price: number;
    priceCategory: "Free" | "Paid";
    studentsQuantity: number;
    slug?: string;
    imageCover?: string;
    level?: "All Levels";
    totalLessons?: number;
    priceDiscount?: number;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type CourseType = InferSchemaType<typeof courseSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface CourseMethods {
    getDiscountedPrice(this: CourseDoc): number;
    hasDiscount(this: CourseDoc): boolean;
}
/**
 * 4. Define statics (optional)
 */
interface CourseStatics {
    findByCategory(this: CourseModel, categoryId: string): Promise<CourseDoc[]>;
    findByInstructor(this: CourseModel, instructorId: string): Promise<CourseDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type CourseDoc = HydratedDocument<CourseType, CourseMethods>;
type CourseModel = Model<CourseType, {}, CourseMethods> & CourseStatics;
/**
 * 11. Export model
 */
declare const Course: CourseModel;
export { Course, CourseType, CourseDoc, CourseModel };
//# sourceMappingURL=courseModel.d.ts.map