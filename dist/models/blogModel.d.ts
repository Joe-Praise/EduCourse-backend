import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const blogSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    title: string;
    category: Types.ObjectId;
    tag: Types.ObjectId[];
    summary: string;
    commentsQuantity: number;
    slug?: string;
    imageCover?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    description: string;
    title: string;
    category: Types.ObjectId;
    tag: Types.ObjectId[];
    summary: string;
    commentsQuantity: number;
    slug?: string;
    imageCover?: string;
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
    title: string;
    category: Types.ObjectId;
    tag: Types.ObjectId[];
    summary: string;
    commentsQuantity: number;
    slug?: string;
    imageCover?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type BlogType = InferSchemaType<typeof blogSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface BlogMethods {
    generateExcerpt(this: BlogDoc, length?: number): string;
    isPublished(this: BlogDoc): boolean;
    incrementComments(this: BlogDoc): Promise<BlogDoc>;
}
/**
 * 4. Define statics (optional)
 */
interface BlogStatics {
    findByCategory(this: BlogModel, categoryId: string): Promise<BlogDoc[]>;
    findByTag(this: BlogModel, tagId: string): Promise<BlogDoc[]>;
    findPublished(this: BlogModel): Promise<BlogDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type BlogDoc = HydratedDocument<BlogType, BlogMethods>;
type BlogModel = Model<BlogType, {}, BlogMethods> & BlogStatics;
/**
 * 11. Export model
 */
declare const Blog: BlogModel;
export { Blog, BlogType, BlogDoc, BlogModel };
//# sourceMappingURL=blogModel.d.ts.map