import { Schema, model, } from 'mongoose';
const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Notification must belong to a user'],
    },
    type: {
        type: String,
        enum: {
            values: [
                'enrollment',
                'review',
                'review_alert',
                'course_published',
                'earning',
                'progress_nudge',
                'system',
            ],
            message: 'Notification type must be one of: enrollment, review, review_alert, course_published, earning, progress_nudge, system',
        },
        required: [true, 'Notification must have a type'],
    },
    title: {
        type: String,
        required: [true, 'Notification must have a title'],
    },
    message: {
        type: String,
        required: [true, 'Notification must have a message'],
    },
    read: {
        type: Boolean,
        default: false,
    },
    link: {
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
notificationSchema.statics.markAllReadForUser = async function (userId) {
    await this.updateMany({ userId, read: false }, { read: true });
};
notificationSchema.statics.countUnreadForUser = async function (userId) {
    return this.countDocuments({ userId, read: false });
};
/**
 * Indexes
 */
notificationSchema.index({ userId: 1 });
notificationSchema.index({ userId: 1, read: 1 });
/**
 * Middleware
 */
notificationSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
const Notification = model('Notification', notificationSchema);
export { Notification };
//# sourceMappingURL=notificationModel.js.map