import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const completedcourseSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    completed: boolean;
    lessonsCompleted: Types.ObjectId[];
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    completed: boolean;
    lessonsCompleted: Types.ObjectId[];
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
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    completed: boolean;
    lessonsCompleted: Types.ObjectId[];
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type CompletedCourseType = InferSchemaType<typeof completedcourseSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface CompletedCourseMethods {
    getTotalLessonsCompleted(this: CompletedCourseDoc): number;
    getCompletionPercentage(this: CompletedCourseDoc, totalLessons: number): number;
}
/**
 * Statics
 */
interface CompletedCourseStatics {
    totalNumberOfStudents(courseId: Types.ObjectId): Promise<void>;
    findByCourse(courseId: string): Promise<CompletedCourseDoc[]>;
    findByUser(userId: string): Promise<CompletedCourseDoc[]>;
}
type CompletedCourseDoc = HydratedDocument<CompletedCourseType, CompletedCourseMethods>;
type CompletedCourseModel = Model<CompletedCourseType, {}, CompletedCourseMethods> & CompletedCourseStatics;
/**
 * Model — first generic is the raw schema type, not the hydrated document
 */
export declare const CompletedCourse: CompletedCourseModel;
export type { CompletedCourseDoc, CompletedCourseModel, CompletedCourseType };
//# sourceMappingURL=completedcourseModel.d.ts.map