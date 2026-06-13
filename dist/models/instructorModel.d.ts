import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const instructorSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    totalRevenue: number;
    source: "user" | "youtube";
    links: Types.ObjectId[];
    expertise: string;
    totalStudents: number;
    totalCourses: number;
    rating: number;
    channelId?: string;
    userId?: Types.ObjectId;
    channelName?: string;
    channelThumbnailUrl?: string;
    channelUrl?: string;
    subscriberCount?: number;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    description: string;
    title: string;
    totalRevenue: number;
    source: "user" | "youtube";
    links: Types.ObjectId[];
    expertise: string;
    totalStudents: number;
    totalCourses: number;
    rating: number;
    channelId?: string;
    userId?: Types.ObjectId;
    channelName?: string;
    channelThumbnailUrl?: string;
    channelUrl?: string;
    subscriberCount?: number;
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
    totalRevenue: number;
    source: "user" | "youtube";
    links: Types.ObjectId[];
    expertise: string;
    totalStudents: number;
    totalCourses: number;
    rating: number;
    channelId?: string;
    userId?: Types.ObjectId;
    channelName?: string;
    channelThumbnailUrl?: string;
    channelUrl?: string;
    subscriberCount?: number;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type InstructorType = InferSchemaType<typeof instructorSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface InstructorMethods {
    getFullProfile(this: InstructorDoc): Promise<InstructorDoc>;
    addLink(this: InstructorDoc, linkId: string): Promise<InstructorDoc>;
    removeLink(this: InstructorDoc, linkId: string): Promise<InstructorDoc>;
}
/**
 * Statics
 */
interface InstructorStatics {
    findByUser(this: InstructorModel, userId: string): Promise<InstructorDoc | null>;
    findByExpertise(this: InstructorModel, expertise: string): Promise<InstructorDoc[]>;
}
type InstructorDoc = HydratedDocument<InstructorType, InstructorMethods>;
type InstructorModel = Model<InstructorType, {}, InstructorMethods> & InstructorStatics;
declare const Instructor: InstructorModel;
export { Instructor, InstructorType, InstructorDoc, InstructorModel };
//# sourceMappingURL=instructorModel.d.ts.map