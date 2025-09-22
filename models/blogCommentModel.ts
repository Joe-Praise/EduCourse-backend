import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

// Import Blog model for comment quantity calculations
const Blog = require('./blogModel');

/**
 * 1. Define schema (single source of truth)
 */
const blogCommentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A blog comment must have a user!'],
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'A blog comment must have a blog!'],
    },
    review: {
      type: String,
      required: [true, 'A blog comment must have content!'],
      trim: true,
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
type BlogCommentType = InferSchemaType<typeof blogCommentSchema> & { _id: Types.ObjectId }

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
 * 6. Add methods
 */
blogCommentSchema.methods.getExcerpt = function (this: BlogCommentDoc, length: number = 100) {
  return this.review.length > length 
    ? this.review.substring(0, length) + '...'
    : this.review;
};

blogCommentSchema.methods.isFromUser = function (this: BlogCommentDoc, userId: string) {
  return this.userId.toString() === userId;
};

/**
 * 7. Add statics
 */
blogCommentSchema.statics.totalNumberOfComments = async function (blogId: string) {
  const stats = await this.aggregate([
    {
      $match: { blogId: new Types.ObjectId(blogId), active: { $ne: false } },
    },
    {
      $count: 'commentsQuantity',
    },
  ]);

  const commentCount = stats.length ? stats[0].commentsQuantity : 0;
  
  await Blog.findByIdAndUpdate(blogId, {
    commentsQuantity: commentCount,
  });
};

blogCommentSchema.statics.findByBlog = function (blogId: string) {
  return this.find({ blogId }).sort({ createdAt: -1 });
};

blogCommentSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * 8. Add indexes
 */
blogCommentSchema.index({ blogId: 1, createdAt: -1 });
blogCommentSchema.index({ userId: 1 });
blogCommentSchema.index({ blogId: 1, userId: 1 }, { unique: true });

/**
 * 9. Middleware (typed this)
 */
blogCommentSchema.pre<Query<BlogCommentDoc[], BlogCommentDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'userId',
    select: '-__v',
  });
  this.populate({
    path: 'blogId',
    select: 'commentsQuantity _id title',
  });
  next();
});

// Calculate total comments when document is saved
blogCommentSchema.post<BlogCommentDoc>('save', function () {
  (this.constructor as BlogCommentModel).totalNumberOfComments(this.blogId.toString());
});

// Handle findOneAndUpdate/findOneAndDelete operations
blogCommentSchema.pre(/^findOneAnd/, async function (next) {
  (this as any).r = await (this as any).model.findOne((this as any).getQuery());
  next();
});

blogCommentSchema.post(/^findOneAnd/, async function () {
  if ((this as any).r) {
    await ((this as any).r.constructor as BlogCommentModel).totalNumberOfComments((this as any).r.blogId.toString());
  }
});

/**
 * 10. Export model
 */
const BlogComment = model<BlogCommentType, BlogCommentModel>("BlogComment", blogCommentSchema);

export { BlogComment, BlogCommentType, BlogCommentDoc, BlogCommentModel };
