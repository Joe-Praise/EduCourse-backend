import { Schema, model, } from 'mongoose';
const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Wishlist item must belong to a user'],
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Wishlist item must reference a course'],
    },
    addedAt: {
        type: Date,
        default: Date.now,
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
wishlistSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
wishlistSchema.statics.isWishlisted = async function (userId, courseId) {
    const doc = await this.findOne({ userId, courseId });
    return !!doc;
};
/**
 * Indexes
 */
wishlistSchema.index({ userId: 1, courseId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1 });
/**
 * Middleware
 */
wishlistSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({
        path: 'courseId',
        select: 'title imageCover price priceDiscount slug ratingsAverage studentsQuantity level',
    });
    next();
});
const Wishlist = model('Wishlist', wishlistSchema);
export { Wishlist };
//# sourceMappingURL=wishlistModel.js.map