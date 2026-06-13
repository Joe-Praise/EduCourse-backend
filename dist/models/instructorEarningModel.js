import { Schema, model, Types, } from 'mongoose';
const instructorEarningSchema = new Schema({
    instructorId: {
        type: Schema.Types.ObjectId,
        ref: 'Instructor',
        required: [true, 'Earning must belong to an instructor'],
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Earning must belong to a course'],
    },
    enrollmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: [true, 'Earning must be linked to an enrollment'],
    },
    amount: {
        type: Number,
        required: [true, 'Earning must have an amount'],
    },
    platformFee: {
        type: Number,
        required: [true, 'Platform fee is required'],
    },
    netEarning: {
        type: Number,
        required: [true, 'Net earning is required'],
    },
    currency: {
        type: String,
        default: 'USD',
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'refunded'],
            message: 'Status must be one of: pending, paid, refunded',
        },
        default: 'pending',
    },
    paidAt: {
        type: Date,
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
instructorEarningSchema.statics.totalEarningsByInstructor = async function (instructorId) {
    const result = await this.aggregate([
        { $match: { instructorId: new Types.ObjectId(instructorId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$netEarning' } } },
    ]);
    return result[0]?.total ?? 0;
};
instructorEarningSchema.statics.earningsByPeriod = async function (instructorId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                instructorId: new Types.ObjectId(instructorId),
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                total: { $sum: '$netEarning' },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: '$_id', total: 1 } },
    ]);
};
/**
 * Indexes
 */
instructorEarningSchema.index({ instructorId: 1 });
instructorEarningSchema.index({ instructorId: 1, status: 1 });
instructorEarningSchema.index({ courseId: 1 });
/**
 * Middleware
 */
instructorEarningSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'courseId', select: 'title' });
    next();
});
const InstructorEarning = model('InstructorEarning', instructorEarningSchema);
export { InstructorEarning };
//# sourceMappingURL=instructorEarningModel.js.map