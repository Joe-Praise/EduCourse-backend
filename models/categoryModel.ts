import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

/**
 * 1. Define schema (single source of truth)
 */
const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'A category must have a name'],
  },
  group: {
    type: String,
    required: [true, 'category is required!'],
    enum: {
      values: ['course', 'blog'],
      message: 'group is either: course, blog',
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 2. Infer base type from schema (no duplication!)
 */
type CategoryType = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId }

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
 * 6. Add methods
 */
categorySchema.methods.isCourseCategory = function (this: CategoryDoc) {
  return this.group === 'course';
};

categorySchema.methods.isBlogCategory = function (this: CategoryDoc) {
  return this.group === 'blog';
};

/**
 * 7. Add statics
 */
categorySchema.statics.findByGroup = function (group: 'course' | 'blog') {
  return this.find({ group });
};

categorySchema.statics.findCourseCategories = function () {
  return this.find({ group: 'course' });
};

categorySchema.statics.findBlogCategories = function () {
  return this.find({ group: 'blog' });
};

/**
 * 8. Add indexes
 */
categorySchema.index({ name: 1, group: 1 }, { unique: true });
categorySchema.index({ group: 1 });

/**
 * 9. Middleware (typed this)
 */
categorySchema.pre<Query<CategoryDoc[], CategoryDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

/**
 * 10. Export model
 */
const Category = model<CategoryType, CategoryModel>("Category", categorySchema);

export { Category, CategoryType, CategoryDoc, CategoryModel };
