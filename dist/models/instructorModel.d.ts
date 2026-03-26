import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const instructorSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    userId: Types.ObjectId;
    title: string;
    links: Types.ObjectId[];
    expertise: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    description: string;
    userId: Types.ObjectId;
    title: string;
    links: Types.ObjectId[];
    expertise: string;
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
    userId: Types.ObjectId;
    title: string;
    links: Types.ObjectId[];
    expertise: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type InstructorType = InferSchemaType<typeof instructorSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface InstructorMethods {
    getFullProfile(this: InstructorDoc): Promise<InstructorDoc>;
    addLink(this: InstructorDoc, linkId: string): Promise<InstructorDoc>;
    removeLink(this: InstructorDoc, linkId: string): Promise<InstructorDoc>;
}
/**
 * 4. Define statics (optional)
 */
interface InstructorStatics {
    findByUser(this: InstructorModel, userId: string): Promise<InstructorDoc | null>;
    findByExpertise(this: InstructorModel, expertise: string): Promise<InstructorDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type InstructorDoc = HydratedDocument<InstructorType, InstructorMethods>;
type InstructorModel = Model<InstructorType, {}, InstructorMethods> & InstructorStatics;
/**
 * 11. Export model
 */
declare const Instructor: InstructorModel;
export { Instructor, InstructorType, InstructorDoc, InstructorModel };
//# sourceMappingURL=instructorModel.d.ts.map