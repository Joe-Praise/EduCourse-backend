"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const mongoose_1 = require("mongoose");
const slugify_1 = __importDefault(require("slugify"));
/**
 * 1. Define schema (single source of truth)
 */
const courseSchema = new mongoose_1.Schema({
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
            values: ['All Levels'],
            message: 'Skill is either: All levels',
        },
    },
    instructors: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Instructor',
            required: [true, 'instructor name is required!'],
        },
    ],
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'A course must have a category!'],
    },
    duration: {
        type: String,
        required: [true, 'A course must have a duration'],
    },
    totalLessons: {
        type: Number,
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: (val) => Math.round(val * 10) / 10,
    },
    ratingSummary: [
        {
            type: Number,
        },
    ],
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A course must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                return val <= this.price;
            },
            message: 'Discount price({VALUE}) should be below or equal to the regular price',
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
        default: 0
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * 6. Add methods
 */
courseSchema.methods.getDiscountedPrice = function () {
    return this.priceDiscount ? this.priceDiscount : this.price;
};
courseSchema.methods.hasDiscount = function () {
    return !!(this.priceDiscount && this.priceDiscount < this.price);
};
/**
 * 7. Add statics
 */
courseSchema.statics.findByCategory = function (categoryId) {
    return this.find({ category: categoryId });
};
courseSchema.statics.findByInstructor = function (instructorId) {
    return this.find({ instructors: instructorId });
};
/**
 * 8. Add indexes
 */
courseSchema.index({ title: 'text' });
/**
 * 9. Add virtuals
 */
courseSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'courseId',
    localField: '_id',
});
/**
 * 10. Middleware (typed this)
 */
courseSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({
        path: 'instructors',
        select: '-__v',
    });
    this.populate({
        path: 'category',
        select: '-__v',
    });
    next();
});
courseSchema.pre('save', function (next) {
    this.slug = (0, slugify_1.default)(this.title, { lower: true });
    next();
});
/**
 * 11. Export model
 */
const Course = (0, mongoose_1.model)("Course", courseSchema);
exports.Course = Course;
//# sourceMappingURL=courseModel.js.map