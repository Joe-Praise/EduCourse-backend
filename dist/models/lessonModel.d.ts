import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const lessonSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    createdAt: NativeDate;
    active: boolean;
    title: string;
    duration: string;
    courseId: Types.ObjectId;
    completed: boolean;
    moduleId: Types.ObjectId;
    url: string;
    lessonIndex: number;
    description?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    title: string;
    duration: string;
    courseId: Types.ObjectId;
    completed: boolean;
    moduleId: Types.ObjectId;
    url: string;
    lessonIndex: number;
    description?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    title: string;
    duration: string;
    courseId: Types.ObjectId;
    completed: boolean;
    moduleId: Types.ObjectId;
    url: string;
    lessonIndex: number;
    description?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type LessonType = InferSchemaType<typeof lessonSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface LessonMethods {
    markCompleted(this: LessonDoc): Promise<LessonDoc>;
    markIncomplete(this: LessonDoc): Promise<LessonDoc>;
    getDurationInMinutes(this: LessonDoc): number;
}
/**
 * 4. Define statics
 */
interface LessonStatics {
    findByModule(this: LessonModel, moduleId: string): Promise<LessonDoc[]>;
    findByCourse(this: LessonModel, courseId: string): Promise<LessonDoc[]>;
    getCompletedCount(this: LessonModel, courseId: string): Promise<number>;
}
/**
 * 5. Combine into document & model types
 */
type LessonDoc = HydratedDocument<LessonType, LessonMethods>;
type LessonModel = Model<LessonType, {}, LessonMethods> & LessonStatics;
/**
 * 9. Export model
 */
declare const Lesson: LessonModel;
export { Lesson, LessonType, LessonDoc, LessonModel };
//# sourceMappingURL=lessonModel.d.ts.map