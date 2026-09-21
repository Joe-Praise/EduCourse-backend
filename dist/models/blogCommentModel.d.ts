import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const blogCommentSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    review: string;
    userId: Types.ObjectId;
    blogId: Types.ObjectId;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    review: string;
    userId: Types.ObjectId;
    blogId: Types.ObjectId;
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
    review: string;
    userId: Types.ObjectId;
    blogId: Types.ObjectId;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type BlogCommentType = InferSchemaType<typeof blogCommentSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface BlogCommentMethods {
    getExcerpt(this: BlogCommentDoc, length?: number): string;
    isFromUser(this: BlogCommentDoc, userId: string): boolean;
}
/**
 * Statics
 */
interface BlogCommentStatics {
    totalNumberOfComments(this: BlogCommentModel, blogId: string): Promise<void>;
    findByBlog(this: BlogCommentModel, blogId: string): Promise<BlogCommentDoc[]>;
    findByUser(this: BlogCommentModel, userId: string): Promise<BlogCommentDoc[]>;
}
type BlogCommentDoc = HydratedDocument<BlogCommentType, BlogCommentMethods>;
type BlogCommentModel = Model<BlogCommentType, {}, BlogCommentMethods> & BlogCommentStatics;
declare const BlogComment: BlogCommentModel;
export { BlogComment, BlogCommentType, BlogCommentDoc, BlogCommentModel };
//# sourceMappingURL=blogCommentModel.d.ts.map