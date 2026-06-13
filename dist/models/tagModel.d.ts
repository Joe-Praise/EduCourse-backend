import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const tagSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    active: boolean;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    active: boolean;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    active: boolean;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type TagType = InferSchemaType<typeof tagSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface TagMethods {
    getSlug(this: TagDoc): string;
}
/**
 * Statics
 */
interface TagStatics {
    findByName(this: TagModel, name: string): Promise<TagDoc | null>;
    findOrCreate(this: TagModel, name: string): Promise<TagDoc>;
}
type TagDoc = HydratedDocument<TagType, TagMethods>;
type TagModel = Model<TagType, {}, TagMethods> & TagStatics;
declare const Tag: TagModel;
export { Tag, TagType, TagDoc, TagModel };
//# sourceMappingURL=tagModel.d.ts.map