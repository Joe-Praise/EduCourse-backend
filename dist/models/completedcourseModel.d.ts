import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
/**
 * 1. Define schema (single source of truth)
 */
declare const completedcourseSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    completed: boolean;
    lessonsCompleted: Types.ObjectId[];
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    completed: boolean;
    lessonsCompleted: Types.ObjectId[];
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
    completed: boolean;
    lessonsCompleted: Types.ObjectId[];
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type CompletedCourseType = InferSchemaType<typeof completedcourseSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface CompletedCourseMethods {
    getTotalLessonsCompleted(this: CompletedCourseDoc): number;
    getCompletionPercentage(this: CompletedCourseDoc, totalLessons: number): number;
}
/**
 * 4. Define statics
 */
interface CompletedCourseStatics {
    totalNumberOfStudents(courseId: Types.ObjectId): Promise<void>;
    findByCourse(courseId: string): Promise<CompletedCourseDoc[]>;
    findByUser(userId: string): Promise<CompletedCourseDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type CompletedCourseDoc = HydratedDocument<CompletedCourseType, CompletedCourseMethods>;
type CompletedCourseModel = Model<CompletedCourseType, {}, CompletedCourseMethods> & CompletedCourseStatics;
/**
 * 11. Create and export model
 */
export declare const CompletedCourse: CompletedCourseModel;
export type { CompletedCourseDoc, CompletedCourseModel, CompletedCourseType };
export default CompletedCourse;
//# sourceMappingURL=completedcourseModel.d.ts.map