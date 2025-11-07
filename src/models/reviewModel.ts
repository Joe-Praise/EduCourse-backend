import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

// Import Course model for rating calculations
import { Course } from './courseModel.js';

/**
 * 1. Define schema (single source of truth)
 */
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
    createdAt: { 
      type: Date, 
      default: Date.now 
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
type ReviewType = InferSchemaType<typeof reviewSchema> & { _id: Types.ObjectId }

/**
 * 3. Define instance methods
 */
interface ReviewMethods {
  isPositive(this: ReviewDoc): boolean;
  getFormattedRating(this: ReviewDoc): string;
}

/**
 * 4. Define statics
 */
interface ReviewStatics {
  calcAverageRatings(this: ReviewModel, courseId: string): Promise<void>;
  findByCourse(this: ReviewModel, courseId: string): Promise<ReviewDoc[]>;
  findByUser(this: ReviewModel, userId: string): Promise<ReviewDoc[]>;
}

/**
 * 5. Combine into document & model types
 */
type ReviewDoc = HydratedDocument<ReviewType, ReviewMethods>;
type ReviewModel = Model<ReviewType, {}, ReviewMethods> & ReviewStatics;

/**
 * 6. Add methods
 */
reviewSchema.methods.isPositive = function (this: ReviewDoc) {
  return this.rating >= 4;
};

reviewSchema.methods.getFormattedRating = function (this: ReviewDoc) {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
};

/**
 * 7. Add statics
 */
reviewSchema.statics.calcAverageRatings = async function (courseId: string) {
  const stats = await this.aggregate([
    {
      $match: { courseId: new Types.ObjectId(courseId) },
    },
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
 * 8. Add indexes
 */
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ courseId: 1 });
reviewSchema.index({ rating: 1 });

/**
 * 9. Middleware (typed this)
 */
reviewSchema.pre<Query<ReviewDoc[], ReviewDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({
    path: 'userId',
    select: '-__v -password',
  });
  next();
});

// Calculate average ratings when review is saved
reviewSchema.post<ReviewDoc>('save', function () {
  (this.constructor as ReviewModel).calcAverageRatings(this.courseId.toString());
});

// Handle findOneAndUpdate/findOneAndDelete operations
reviewSchema.pre(/^findOneAnd/, async function (next) {
  (this as any).r = await (this as any).model.findOne((this as any).getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if ((this as any).r) {
    await ((this as any).r.constructor as ReviewModel).calcAverageRatings((this as any).r.courseId.toString());
  }
});

/**
 * 10. Export model
 */
const Review = model<ReviewType, ReviewModel>("Review", reviewSchema);

export { Review, ReviewType, ReviewDoc, ReviewModel };
