import { Schema, model } from 'mongoose';
import { Course } from './courseModel.js';
const completedcourseSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Completed course must belong to a user!'],
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Completed course must belong to an existing course!'],
    },
    completed: {
        type: Boolean,
        default: false,
    },
    active: {
        type: Boolean,
        default: true,
    },
    lessonsCompleted: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Lesson',
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Methods
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
 * Statics
 */
completedcourseSchema.statics.totalNumberOfStudents = async function (courseId) {
    const stats = await this.aggregate([
        { $match: { courseId } },
        { $count: 'studentsQuantity' },
    ]);
    const studentsQuantity = stats.length > 0 ? stats[0].studentsQuantity : 0;
    await Course.findByIdAndUpdate(courseId, { studentsQuantity });
};
completedcourseSchema.statics.findByCourse = function (courseId) {
    return this.find({ courseId });
};
completedcourseSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
/**
 * Indexes
 */
completedcourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
completedcourseSchema.index({ courseId: 1 });
completedcourseSchema.index({ userId: 1 });
/**
 * Middleware — single pre-find hook: filter inactive + populate
 */
completedcourseSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'userId', select: '-__v -password' });
    this.populate({ path: 'courseId', select: '-__v' });
    next();
});
/**
 * Post-save hook: update denormalised student count on Course
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
 * Model — first generic is the raw schema type, not the hydrated document
 */
export const CompletedCourse = model('CompletedCourse', completedcourseSchema);
//# sourceMappingURL=completedcourseModel.js.map