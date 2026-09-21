import { Schema, model, Types } from "mongoose";
import { Course } from './courseModel.js';
const reviewSchema = new Schema({
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Methods
 */
reviewSchema.methods.isPositive = function () {
    return this.rating >= 4;
};
reviewSchema.methods.getFormattedRating = function () {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
};
/**
 * Statics
 */
reviewSchema.statics.calcAverageRatings = async function (courseId) {
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
    }
    else {
        await Course.findByIdAndUpdate(courseId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};
reviewSchema.statics.findByCourse = function (courseId) {
    return this.find({ courseId });
};
reviewSchema.statics.findByUser = function (userId) {
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
reviewSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'userId', select: '-__v -password' });
    next();
});
reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.courseId.toString());
});
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.model.findOne(this.getQuery());
    next();
});
reviewSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.calcAverageRatings(this.r.courseId.toString());
    }
});
const Review = model("Review", reviewSchema);
export { Review };
//# sourceMappingURL=reviewModel.js.map