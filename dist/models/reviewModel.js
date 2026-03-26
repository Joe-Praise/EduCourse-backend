"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
// Import Course model for rating calculations
const Course = require('./courseModel');
/**
 * 1. Define schema (single source of truth)
 */
const reviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A review must have a user'],
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * 6. Add methods
 */
reviewSchema.methods.isPositive = function () {
    return this.rating >= 4;
};
reviewSchema.methods.getFormattedRating = function () {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
};
/**
 * 7. Add statics
 */
reviewSchema.statics.calcAverageRatings = async function (courseId) {
    const stats = await this.aggregate([
        {
            $match: { courseId: new mongoose_1.Types.ObjectId(courseId) },
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
 * 8. Add indexes
 */
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ courseId: 1 });
reviewSchema.index({ rating: 1 });
/**
 * 9. Middleware (typed this)
 */
reviewSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({
        path: 'userId',
        select: '-__v -password',
    });
    next();
});
// Calculate average ratings when review is saved
reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.courseId.toString());
});
// Handle findOneAndUpdate/findOneAndDelete operations
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.model.findOne(this.getQuery());
    next();
});
reviewSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.calcAverageRatings(this.r.courseId.toString());
    }
});
/**
 * 10. Export model
 */
const Review = (0, mongoose_1.model)("Review", reviewSchema);
exports.Review = Review;
//# sourceMappingURL=reviewModel.js.map