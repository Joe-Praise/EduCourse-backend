import { Schema, model, Types } from "mongoose";
import { Blog } from './blogModel.js';
const blogCommentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A blog comment must have a user!'],
    },
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
        required: [true, 'A blog comment must have a blog!'],
    },
    review: {
        type: String,
        required: [true, 'A blog comment must have content!'],
        trim: true,
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
blogCommentSchema.methods.getExcerpt = function (length = 100) {
    return this.review.length > length
        ? this.review.substring(0, length) + '...'
        : this.review;
};
blogCommentSchema.methods.isFromUser = function (userId) {
    return this.userId.toString() === userId;
};
/**
 * Statics
 */
blogCommentSchema.statics.totalNumberOfComments = async function (blogId) {
    const stats = await this.aggregate([
        { $match: { blogId: new Types.ObjectId(blogId), active: { $ne: false } } },
        { $count: 'commentsQuantity' },
    ]);
    const commentCount = stats.length ? stats[0].commentsQuantity : 0;
    await Blog.findByIdAndUpdate(blogId, { commentsQuantity: commentCount });
};
blogCommentSchema.statics.findByBlog = function (blogId) {
    return this.find({ blogId }).sort({ createdAt: -1 });
};
blogCommentSchema.statics.findByUser = function (userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};
/**
 * Indexes
 * Note: no unique constraint on blogId+userId — users may comment multiple times
 */
blogCommentSchema.index({ blogId: 1, createdAt: -1 });
blogCommentSchema.index({ userId: 1 });
/**
 * Middleware
 */
blogCommentSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'userId', select: '-__v' });
    this.populate({ path: 'blogId', select: 'commentsQuantity _id title' });
    next();
});
blogCommentSchema.post('save', function () {
    this.constructor.totalNumberOfComments(this.blogId.toString());
});
blogCommentSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.model.findOne(this.getQuery());
    next();
});
blogCommentSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.totalNumberOfComments(this.r.blogId.toString());
    }
});
const BlogComment = model("BlogComment", blogCommentSchema);
export { BlogComment };
//# sourceMappingURL=blogCommentModel.js.map