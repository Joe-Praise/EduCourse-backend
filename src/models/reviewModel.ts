import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";
import { Course } from './courseModel.js';

const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must have a user'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'A review must have a course'],
    },
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review must have a rating'],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    moderationNote: {
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
type ReviewType = InferSchemaType<typeof reviewSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Instance methods
 */
interface ReviewMethods {
  isPositive(this: ReviewDoc): boolean;
  getFormattedRating(this: ReviewDoc): string;
}

/**
 * Statics
 */
interface ReviewStatics {
  calcAverageRatings(this: ReviewModel, courseId: string): Promise<void>;
  findByCourse(this: ReviewModel, courseId: string): Promise<ReviewDoc[]>;
  findByUser(this: ReviewModel, userId: string): Promise<ReviewDoc[]>;
}

type ReviewDoc = HydratedDocument<ReviewType, ReviewMethods>;
type ReviewModel = Model<ReviewType, {}, ReviewMethods> & ReviewStatics;

/**
 * Methods
 */
reviewSchema.methods.isPositive = function (this: ReviewDoc) {
  return this.rating >= 4;
};

reviewSchema.methods.getFormattedRating = function (this: ReviewDoc) {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
};

/**
 * Statics
 */
reviewSchema.statics.calcAverageRatings = async function (courseId: string) {
  const stats = await this.aggregate([
    { $match: { courseId: new Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$courseId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length) {
    await Course.findByIdAndUpdate(courseId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId });
};

reviewSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId });
};

/**
 * Indexes
 */
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ courseId: 1 });
reviewSchema.index({ rating: 1 });

/**
 * Middleware
 */
reviewSchema.pre<Query<ReviewDoc[], ReviewDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({ path: 'userId', select: '-__v -password' });
  next();
});

reviewSchema.post<ReviewDoc>('save', function () {
  (this.constructor as ReviewModel).calcAverageRatings(this.courseId.toString());
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  (this as any).r = await (this as any).model.findOne((this as any).getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if ((this as any).r) {
    await ((this as any).r.constructor as ReviewModel).calcAverageRatings(
      (this as any).r.courseId.toString(),
    );
  }
});

const Review = model<ReviewType, ReviewModel>("Review", reviewSchema);

export { Review, ReviewType, ReviewDoc, ReviewModel };
