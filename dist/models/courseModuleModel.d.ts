import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const courseModuleSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    title: string;
    courseId: Types.ObjectId;
    moduleIndex: number;
    section: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    title: string;
    courseId: Types.ObjectId;
    moduleIndex: number;
    section: string;
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
    title: string;
    courseId: Types.ObjectId;
    moduleIndex: number;
    section: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type CourseModuleType = InferSchemaType<typeof courseModuleSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type CourseModuleDoc = HydratedDocument<CourseModuleType>;
type CourseModuleModel = Model<CourseModuleType, {}, {}>;
declare const CourseModule: CourseModuleModel;
export { CourseModule, CourseModuleType, CourseModuleDoc, CourseModuleModel };
//# sourceMappingURL=courseModuleModel.d.ts.map