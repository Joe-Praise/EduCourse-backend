import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const lessonSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    url: string;
    active: boolean;
    title: string;
    duration: string;
    courseId: Types.ObjectId;
    moduleId: Types.ObjectId;
    lessonIndex: number;
    description?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    url: string;
    active: boolean;
    title: string;
    duration: string;
    courseId: Types.ObjectId;
    moduleId: Types.ObjectId;
    lessonIndex: number;
    description?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    url: string;
    active: boolean;
    title: string;
    duration: string;
    courseId: Types.ObjectId;
    moduleId: Types.ObjectId;
    lessonIndex: number;
    description?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type LessonType = InferSchemaType<typeof lessonSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface LessonMethods {
    getDurationInMinutes(this: LessonDoc): number;
}
/**
 * Statics
 */
interface LessonStatics {
    findByModule(this: LessonModel, moduleId: string): Promise<LessonDoc[]>;
    findByCourse(this: LessonModel, courseId: string): Promise<LessonDoc[]>;
    getCompletedCount(this: LessonModel, courseId: string, userId: string): Promise<number>;
}
type LessonDoc = HydratedDocument<LessonType, LessonMethods>;
type LessonModel = Model<LessonType, {}, LessonMethods> & LessonStatics;
declare const Lesson: LessonModel;
export { Lesson, LessonType, LessonDoc, LessonModel };
//# sourceMappingURL=lessonModel.d.ts.map