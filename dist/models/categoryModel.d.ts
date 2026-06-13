import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const categorySchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    group: "course" | "blog";
    active: boolean;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    group: "course" | "blog";
    active: boolean;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    group: "course" | "blog";
    active: boolean;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type CategoryType = InferSchemaType<typeof categorySchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface CategoryMethods {
    isCourseCategory(this: CategoryDoc): boolean;
    isBlogCategory(this: CategoryDoc): boolean;
}
/**
 * Statics
 */
interface CategoryStatics {
    findByGroup(this: CategoryModel, group: 'course' | 'blog'): Promise<CategoryDoc[]>;
    findCourseCategories(this: CategoryModel): Promise<CategoryDoc[]>;
    findBlogCategories(this: CategoryModel): Promise<CategoryDoc[]>;
}
type CategoryDoc = HydratedDocument<CategoryType, CategoryMethods>;
type CategoryModel = Model<CategoryType, {}, CategoryMethods> & CategoryStatics;
declare const Category: CategoryModel;
export { Category, CategoryType, CategoryDoc, CategoryModel };
//# sourceMappingURL=categoryModel.d.ts.map