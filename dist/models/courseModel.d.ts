import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const courseSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    description: string;
    title: string;
    instructors: Types.ObjectId[];
    ratingsAverage: number;
    ratingsQuantity: number;
    price: number;
    priceCategory: "Free" | "Paid";
    studentsQuantity: number;
    publishedStatus: "importing" | "draft" | "review" | "published" | "archived" | "failed";
    totalRevenue: number;
    aiTags: string[];
    level?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
    slug?: string;
    imageCover?: string;
    aiInstructor?: string;
    category?: Types.ObjectId;
    duration?: string;
    totalLessons?: number;
    priceDiscount?: number;
    publishedAt?: NativeDate;
    submittedForReviewAt?: NativeDate;
    aiScore?: number;
    aiFeedback?: string;
    aiReviewedAt?: NativeDate;
    youtubePlaylistId?: string;
    channelId?: string;
    videoCount?: number;
    qualityScore?: number;
    aiSummary?: {
        summary: string[];
        difficulty?: string;
        prerequisites?: string;
        willBuild?: string;
    };
    importQuery?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    description: string;
    title: string;
    instructors: Types.ObjectId[];
    ratingsAverage: number;
    ratingsQuantity: number;
    price: number;
    priceCategory: "Free" | "Paid";
    studentsQuantity: number;
    publishedStatus: "importing" | "draft" | "review" | "published" | "archived" | "failed";
    totalRevenue: number;
    aiTags: string[];
    level?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
    slug?: string;
    imageCover?: string;
    aiInstructor?: string;
    category?: Types.ObjectId;
    duration?: string;
    totalLessons?: number;
    priceDiscount?: number;
    publishedAt?: NativeDate;
    submittedForReviewAt?: NativeDate;
    aiScore?: number;
    aiFeedback?: string;
    aiReviewedAt?: NativeDate;
    youtubePlaylistId?: string;
    channelId?: string;
    videoCount?: number;
    qualityScore?: number;
    aiSummary?: {
        summary: string[];
        difficulty?: string;
        prerequisites?: string;
        willBuild?: string;
    };
    importQuery?: string;
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
    description: string;
    title: string;
    instructors: Types.ObjectId[];
    ratingsAverage: number;
    ratingsQuantity: number;
    price: number;
    priceCategory: "Free" | "Paid";
    studentsQuantity: number;
    publishedStatus: "importing" | "draft" | "review" | "published" | "archived" | "failed";
    totalRevenue: number;
    aiTags: string[];
    level?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
    slug?: string;
    imageCover?: string;
    aiInstructor?: string;
    category?: Types.ObjectId;
    duration?: string;
    totalLessons?: number;
    priceDiscount?: number;
    publishedAt?: NativeDate;
    submittedForReviewAt?: NativeDate;
    aiScore?: number;
    aiFeedback?: string;
    aiReviewedAt?: NativeDate;
    youtubePlaylistId?: string;
    channelId?: string;
    videoCount?: number;
    qualityScore?: number;
    aiSummary?: {
        summary: string[];
        difficulty?: string;
        prerequisites?: string;
        willBuild?: string;
    };
    importQuery?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type CourseType = InferSchemaType<typeof courseSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods — defined before CourseDoc/CourseModel types that reference them
 */
interface CourseMethods {
    getDiscountedPrice(this: CourseDoc): number;
    hasDiscount(this: CourseDoc): boolean;
}
/**
 * Statics
 */
interface CourseStatics {
    findByCategory(this: CourseModel, categoryId: string): Promise<CourseDoc[]>;
    findByInstructor(this: CourseModel, instructorId: string): Promise<CourseDoc[]>;
    findByStatus(this: CourseModel, status: string): Promise<CourseDoc[]>;
    findAllByInstructor(this: CourseModel, instructorId: string): Promise<CourseDoc[]>;
}
type CourseDoc = HydratedDocument<CourseType, CourseMethods>;
type CourseModel = Model<CourseType, {}, CourseMethods> & CourseStatics;
declare const Course: CourseModel;
export { Course, CourseType, CourseDoc, CourseModel };
//# sourceMappingURL=courseModel.d.ts.map