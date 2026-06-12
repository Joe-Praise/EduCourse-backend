import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';
import slugify from 'slugify';

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide course title!'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please provide course description!'],
    },
    imageCover: {
      type: String,
    },
    level: {
      type: String,
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        message:
          'Level must be one of: Beginner, Intermediate, Advanced, All Levels',
      },
    },
    instructors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Instructor',
      },
    ],
    aiInstructor: {
      type: String,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    duration: {
      type: String,
    },
    totalLessons: {
      type: Number,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: any, val: number) {
          return val <= this.price;
        },
        message:
          'Discount price ({VALUE}) should be below or equal to the regular price',
      },
    },
    priceCategory: {
      type: String,
      required: [true, 'A course must have a price category'],
      enum: {
        values: ['Free', 'Paid'],
        message: 'Price category is either: Free, Paid',
      },
      default: 'Free',
    },
    studentsQuantity: {
      type: Number,
      default: 0,
    },
    publishedStatus: {
      type: String,
      enum: {
        values: ['importing', 'draft', 'review', 'published', 'archived', 'failed'],
        message:
          'Published status must be one of: importing, draft, review, published, archived, failed',
      },
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    submittedForReviewAt: {
      type: Date,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiFeedback: {
      type: String,
    },
    aiReviewedAt: {
      type: Date,
    },
    youtubePlaylistId: {
      type: String,
    },
    channelId: {
      type: String,
    },
    videoCount: {
      type: Number,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiSummary: {
      difficulty: { type: String },
      prerequisites: { type: String },
      willBuild: { type: String },
      summary: [{ type: String }],
    },
    aiTags: [{ type: String }],
    importQuery: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Infer base type from schema (no duplication!)
 */
type CourseType = InferSchemaType<typeof courseSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Instance methods — defined before CourseDoc/CourseModel types that reference them
 */
interface CourseMethods {
  getDiscountedPrice(this: CourseDoc): number;
  hasDiscount(this: CourseDoc): boolean;
}

/**
 * Statics
 */
interface CourseStatics {
  findByCategory(this: CourseModel, categoryId: string): Promise<CourseDoc[]>;
  findByInstructor(
    this: CourseModel,
    instructorId: string,
  ): Promise<CourseDoc[]>;
  findByStatus(this: CourseModel, status: string): Promise<CourseDoc[]>;
  findAllByInstructor(
    this: CourseModel,
    instructorId: string,
  ): Promise<CourseDoc[]>;
}

type CourseDoc = HydratedDocument<CourseType, CourseMethods>;
type CourseModel = Model<CourseType, {}, CourseMethods> & CourseStatics;

/**
 * Methods
 */
courseSchema.methods.getDiscountedPrice = function (this: CourseDoc) {
  return this.priceDiscount ? this.priceDiscount : this.price;
};

courseSchema.methods.hasDiscount = function (this: CourseDoc) {
  return !!(this.priceDiscount && this.priceDiscount < this.price);
};

/**
 * Statics
 */
courseSchema.statics.findByCategory = function (categoryId: string) {
  return this.find({ category: categoryId });
};

courseSchema.statics.findByInstructor = function (instructorId: string) {
  return this.find({ instructors: instructorId });
};

courseSchema.statics.findByStatus = function (status: string) {
  return this.find({ publishedStatus: status });
};

// Bypasses the pre-find publishedStatus filter — used by instructor dashboard
courseSchema.statics.findAllByInstructor = function (instructorId: string) {
  return this.find({ instructors: instructorId }).setOptions({
    skipPublishedFilter: true,
  });
};

/**
 * Indexes
 */
courseSchema.index({ title: 'text' });

/**
 * Virtuals
 */
courseSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'courseId',
  localField: '_id',
});

/**
 * Middleware
 */
courseSchema.pre<Query<CourseDoc[], CourseDoc>>(/^find/, function (next) {
  const opts = this.getOptions() as any;
  if (!opts.skipPublishedFilter) {
    this.find({ publishedStatus: 'published' });
  }
  this.find({ active: { $ne: false } });
  this.populate({ path: 'instructors', select: '-__v' });
  this.populate({ path: 'category', select: '-__v' });
  next();
});

courseSchema.pre<CourseDoc>('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Course = model<CourseType, CourseModel>('Course', courseSchema);

export { Course, CourseType, CourseDoc, CourseModel };
