import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const blogSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    category: Types.ObjectId;
    summary: string;
    tag: Types.ObjectId[];
    commentsQuantity: number;
    slug?: string;
    imageCover?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    description: string;
    title: string;
    category: Types.ObjectId;
    summary: string;
    tag: Types.ObjectId[];
    commentsQuantity: number;
    slug?: string;
    imageCover?: string;
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
    category: Types.ObjectId;
    summary: string;
    tag: Types.ObjectId[];
    commentsQuantity: number;
    slug?: string;
    imageCover?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type BlogType = InferSchemaType<typeof blogSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface BlogMethods {
    generateExcerpt(this: BlogDoc, length?: number): string;
    isPublished(this: BlogDoc): boolean;
}
/**
 * Statics
 */
interface BlogStatics {
    findByCategory(this: BlogModel, categoryId: string): Promise<BlogDoc[]>;
    findByTag(this: BlogModel, tagId: string): Promise<BlogDoc[]>;
    findPublished(this: BlogModel): Promise<BlogDoc[]>;
}
type BlogDoc = HydratedDocument<BlogType, BlogMethods>;
type BlogModel = Model<BlogType, {}, BlogMethods> & BlogStatics;
declare const Blog: BlogModel;
export { Blog, BlogType, BlogDoc, BlogModel };
//# sourceMappingURL=blogModel.d.ts.map