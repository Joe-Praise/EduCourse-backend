import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const tagSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    createdAt: NativeDate;
    name: string;
    active: boolean;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    name: string;
    active: boolean;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    name: string;
    active: boolean;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type TagType = InferSchemaType<typeof tagSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface TagMethods {
    getSlug(this: TagDoc): string;
}
/**
 * 4. Define statics
 */
interface TagStatics {
    findByName(this: TagModel, name: string): Promise<TagDoc | null>;
    findOrCreate(this: TagModel, name: string): Promise<TagDoc>;
}
/**
 * 5. Combine into document & model types
 */
type TagDoc = HydratedDocument<TagType, TagMethods>;
type TagModel = Model<TagType, {}, TagMethods> & TagStatics;
/**
 * 11. Export model
 */
declare const Tag: TagModel;
export { Tag, TagType, TagDoc, TagModel };
//# sourceMappingURL=tagModel.d.ts.map