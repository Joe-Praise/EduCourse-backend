"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogComment = void 0;
const mongoose_1 = require("mongoose");
// Import Blog model for comment quantity calculations
const Blog = require('./blogModel');
/**
 * 1. Define schema (single source of truth)
 */
const blogCommentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A blog comment must have a user!'],
    },
    blogId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Blog',
        required: [true, 'A blog comment must have a blog!'],
    },
    review: {
        type: String,
        required: [true, 'A blog comment must have content!'],
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
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
blogCommentSchema.methods.getExcerpt = function (length = 100) {
    return this.review.length > length
        ? this.review.substring(0, length) + '...'
        : this.review;
};
blogCommentSchema.methods.isFromUser = function (userId) {
    return this.userId.toString() === userId;
};
/**
 * 7. Add statics
 */
blogCommentSchema.statics.totalNumberOfComments = async function (blogId) {
    const stats = await this.aggregate([
        {
            $match: { blogId: new mongoose_1.Types.ObjectId(blogId), active: { $ne: false } },
        },
        {
            $count: 'commentsQuantity',
        },
    ]);
    const commentCount = stats.length ? stats[0].commentsQuantity : 0;
    await Blog.findByIdAndUpdate(blogId, {
        commentsQuantity: commentCount,
    });
};
blogCommentSchema.statics.findByBlog = function (blogId) {
    return this.find({ blogId }).sort({ createdAt: -1 });
};
blogCommentSchema.statics.findByUser = function (userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};
/**
 * 8. Add indexes
 */
blogCommentSchema.index({ blogId: 1, createdAt: -1 });
blogCommentSchema.index({ userId: 1 });
blogCommentSchema.index({ blogId: 1, userId: 1 }, { unique: true });
/**
 * 9. Middleware (typed this)
 */
blogCommentSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({
        path: 'userId',
        select: '-__v',
    });
    this.populate({
        path: 'blogId',
        select: 'commentsQuantity _id title',
    });
    next();
});
// Calculate total comments when document is saved
blogCommentSchema.post('save', function () {
    this.constructor.totalNumberOfComments(this.blogId.toString());
});
// Handle findOneAndUpdate/findOneAndDelete operations
blogCommentSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.model.findOne(this.getQuery());
    next();
});
blogCommentSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.totalNumberOfComments(this.r.blogId.toString());
    }
});
/**
 * 10. Export model
 */
const BlogComment = (0, mongoose_1.model)("BlogComment", blogCommentSchema);
exports.BlogComment = BlogComment;
//# sourceMappingURL=blogCommentModel.js.map