import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";
import slugify from "slugify";

/**
 * 1. Define schema (single source of truth)
 */
const blogSchema = new Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A blog must have a category!'],
    },
    slug: String,
    tag: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    title: {
      type: String,
      required: [true, 'A blog must have a title!'],
    },
    imageCover: {
      type: String,
    },
    description: {
      type: String,
      required: [true, 'A blog must have description!'],
    },
    summary: {
      type: String,
      required: [true, 'A blog must have summary!'],
    },
    commentsQuantity: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * 2. Infer base type from schema (no duplication!)
 */
type BlogType = InferSchemaType<typeof blogSchema> & { _id: Types.ObjectId }

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
 * 6. Add methods
 */
blogSchema.methods.generateExcerpt = function (this: BlogDoc, length: number = 150) {
  return this.description.length > length 
    ? this.description.substring(0, length) + '...'
    : this.description;
};

blogSchema.methods.isPublished = function (this: BlogDoc) {
  return this.active !== false;
};

blogSchema.methods.incrementComments = async function (this: BlogDoc) {
  this.commentsQuantity = (this.commentsQuantity || 0) + 1;
  return await this.save();
};

/**
 * 7. Add statics
 */
blogSchema.statics.findByCategory = function (categoryId: string) {
  return this.find({ category: categoryId });
};

blogSchema.statics.findByTag = function (tagId: string) {
  return this.find({ tag: tagId });
};

blogSchema.statics.findPublished = function () {
  return this.find({ active: { $ne: false } });
};

/**
 * 8. Add indexes
 */
blogSchema.index({ title: 'text', description: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ tag: 1 });

/**
 * 9. Add virtuals
 */
blogSchema.virtual('comments', {
  ref: 'BlogComment',
  foreignField: 'blogId',
  localField: '_id',
});

/**
 * 10. Middleware (typed this)
 */
blogSchema.pre<Query<BlogDoc[], BlogDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'category',
    select: '-__v',
  });

  this.populate({
    path: 'tag',
    select: '-__v',
  });
  next();
});

blogSchema.pre<BlogDoc>('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

/**
 * 11. Export model
 */
const Blog = model<BlogType, BlogModel>("Blog", blogSchema);

export { Blog, BlogType, BlogDoc, BlogModel };
