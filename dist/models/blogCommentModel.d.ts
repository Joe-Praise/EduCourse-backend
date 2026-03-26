import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const blogCommentSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    blogId: Types.ObjectId;
    review: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    blogId: Types.ObjectId;
    review: string;
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
    blogId: Types.ObjectId;
    review: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type BlogCommentType = InferSchemaType<typeof blogCommentSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface BlogCommentMethods {
    getExcerpt(this: BlogCommentDoc, length?: number): string;
    isFromUser(this: BlogCommentDoc, userId: string): boolean;
}
/**
 * 4. Define statics
 */
interface BlogCommentStatics {
    totalNumberOfComments(this: BlogCommentModel, blogId: string): Promise<void>;
    findByBlog(this: BlogCommentModel, blogId: string): Promise<BlogCommentDoc[]>;
    findByUser(this: BlogCommentModel, userId: string): Promise<BlogCommentDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type BlogCommentDoc = HydratedDocument<BlogCommentType, BlogCommentMethods>;
type BlogCommentModel = Model<BlogCommentType, {}, BlogCommentMethods> & BlogCommentStatics;
/**
 * 10. Export model
 */
declare const BlogComment: BlogCommentModel;
export { BlogComment, BlogCommentType, BlogCommentDoc, BlogCommentModel };
//# sourceMappingURL=blogCommentModel.d.ts.map