"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletedCourse = void 0;
const mongoose_1 = require("mongoose");
const courseModel_js_1 = require("./courseModel.js");
/**
 * 1. Define schema (single source of truth)
 */
const completedcourseSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Completed course must belong to a user!'],
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Completed course must belong to an existing course!'],
    },
    completed: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    active: {
        type: Boolean,
        default: true,
    },
    lessonsCompleted: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Lesson',
        },
    ],
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * 6. Add methods
 */
completedcourseSchema.methods.getTotalLessonsCompleted = function () {
    return this.lessonsCompleted.length;
};
completedcourseSchema.methods.getCompletionPercentage = function (totalLessons) {
    if (totalLessons === 0)
        return 0;
    return Math.round((this.lessonsCompleted.length / totalLessons) * 100);
};
/**
 * 7. Add statics
 */
completedcourseSchema.statics.totalNumberOfStudents = async function (courseId) {
    const stats = await this.aggregate([
        {
            $match: { courseId },
        },
        {
            $count: 'studentsQuantity',
        },
    ]);
    const studentsQuantity = stats.length > 0 ? stats[0].studentsQuantity : 0;
    await courseModel_js_1.Course.findByIdAndUpdate(courseId, {
        studentsQuantity,
    });
};
completedcourseSchema.statics.findByCourse = function (courseId) {
    return this.find({ courseId });
};
completedcourseSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
/**
 * 8. Add indexes
 */
completedcourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
completedcourseSchema.index({ courseId: 1 });
completedcourseSchema.index({ userId: 1 });
/**
 * 8. Add indexes
 */
completedcourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
completedcourseSchema.index({ courseId: 1 });
completedcourseSchema.index({ userId: 1 });
/**
 * 9. Add middleware (typed this)
 */
completedcourseSchema.pre(/^find/, function () {
    this.find({ active: { $ne: false } });
});
completedcourseSchema.pre(/^find/, function () {
    this.populate({
        path: 'userId',
        select: '-__v -password',
    });
    this.populate({
        path: 'courseId',
        select: '-__v',
    });
});
completedcourseSchema.post(/^find/, function () {
    this.populate({
        path: 'courseId',
        select: '-__v',
    });
});
/**
 * 10. Add post-save middleware for automatic student count updates
 */
completedcourseSchema.post('save', function () {
    this.constructor.totalNumberOfStudents(this.courseId);
});
completedcourseSchema.pre(/^findOneAnd/, async function () {
    this.r = await this.clone().findOne();
});
completedcourseSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.totalNumberOfStudents(this.r.courseId);
    }
});
/**
 * 11. Create and export model
 */
exports.CompletedCourse = (0, mongoose_1.model)('CompletedCourse', completedcourseSchema);
exports.default = exports.CompletedCourse;
//# sourceMappingURL=completedcourseModel.js.map