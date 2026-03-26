import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const categorySchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    createdAt: NativeDate;
    name: string;
    active: boolean;
    group: "course" | "blog";
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    name: string;
    active: boolean;
    group: "course" | "blog";
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    name: string;
    active: boolean;
    group: "course" | "blog";
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type CategoryType = InferSchemaType<typeof categorySchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface CategoryMethods {
    isCourseCategory(this: CategoryDoc): boolean;
    isBlogCategory(this: CategoryDoc): boolean;
}
/**
 * 4. Define statics (optional)
 */
interface CategoryStatics {
    findByGroup(this: CategoryModel, group: 'course' | 'blog'): Promise<CategoryDoc[]>;
    findCourseCategories(this: CategoryModel): Promise<CategoryDoc[]>;
    findBlogCategories(this: CategoryModel): Promise<CategoryDoc[]>;
}
/**
 * 5. Combine into document & model types
 */
type CategoryDoc = HydratedDocument<CategoryType, CategoryMethods>;
type CategoryModel = Model<CategoryType, {}, CategoryMethods> & CategoryStatics;
/**
 * 10. Export model
 */
declare const Category: CategoryModel;
export { Category, CategoryType, CategoryDoc, CategoryModel };
//# sourceMappingURL=categoryModel.d.ts.map