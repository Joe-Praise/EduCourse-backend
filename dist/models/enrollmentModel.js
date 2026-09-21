import { Schema, model, } from 'mongoose';
const enrollmentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Enrollment must belong to a user'],
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Enrollment must belong to a course'],
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
    paymentRef: {
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
enrollmentSchema.statics.findByCourse = function (courseId) {
    return this.find({ courseId });
};
enrollmentSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
enrollmentSchema.statics.countByCourse = async function (courseId) {
    return this.countDocuments({ courseId });
};
/**
 * Indexes
 */
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ userId: 1 });
/**
 * Middleware — filter active, populate references
 */
enrollmentSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'userId', select: 'name photo email' });
    this.populate({ path: 'courseId', select: 'title price imageCover slug' });
    next();
});
const Enrollment = model('Enrollment', enrollmentSchema);
export { Enrollment };
//# sourceMappingURL=enrollmentModel.js.map