import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

const categorySchema = new Schema(
  {
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
  },
  { timestamps: true },
);

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

/**
 * Methods
 */
categorySchema.methods.isCourseCategory = function (this: CategoryDoc) {
  return this.group === 'course';
};

categorySchema.methods.isBlogCategory = function (this: CategoryDoc) {
  return this.group === 'blog';
};

/**
 * Statics
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
 * Indexes
 */
categorySchema.index({ name: 1, group: 1 }, { unique: true });
categorySchema.index({ group: 1 });

/**
 * Middleware
 */
categorySchema.pre<Query<CategoryDoc[], CategoryDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Category = model<CategoryType, CategoryModel>("Category", categorySchema);

export { Category, CategoryType, CategoryDoc, CategoryModel };
