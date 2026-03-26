"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const slugify_1 = __importDefault(require("slugify"));
/**
 * 1. Define schema (single source of truth)
 */
const blogSchema = new mongoose_1.Schema({
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'A blog must have a category!'],
    },
    slug: String,
    tag: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Tag',
        },
    ],
    title: {
        type: String,
        required: [true, 'A blog must have a title!'],
    },
    imageCover: {
        type: String,
    },
    description: {
        type: String,
        required: [true, 'A blog must have description!'],
    },
    summary: {
        type: String,
        required: [true, 'A blog must have summary!'],
    },
    commentsQuantity: {
        type: Number,
        default: 0,
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
blogSchema.methods.generateExcerpt = function (length = 150) {
    return this.description.length > length
        ? this.description.substring(0, length) + '...'
        : this.description;
};
blogSchema.methods.isPublished = function () {
    return this.active !== false;
};
blogSchema.methods.incrementComments = async function () {
    this.commentsQuantity = (this.commentsQuantity || 0) + 1;
    return await this.save();
};
/**
 * 7. Add statics
 */
blogSchema.statics.findByCategory = function (categoryId) {
    return this.find({ category: categoryId });
};
blogSchema.statics.findByTag = function (tagId) {
    return this.find({ tag: tagId });
};
blogSchema.statics.findPublished = function () {
    return this.find({ active: { $ne: false } });
};
/**
 * 8. Add indexes
 */
blogSchema.index({ title: 'text', description: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ tag: 1 });
/**
 * 9. Add virtuals
 */
blogSchema.virtual('comments', {
    ref: 'BlogComment',
    foreignField: 'blogId',
    localField: '_id',
});
/**
 * 10. Middleware (typed this)
 */
blogSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({
        path: 'category',
        select: '-__v',
    });
    this.populate({
        path: 'tag',
        select: '-__v',
    });
    next();
});
blogSchema.pre('save', function (next) {
    this.slug = (0, slugify_1.default)(this.title, { lower: true });
    next();
});
/**
 * 11. Export model
 */
const Blog = (0, mongoose_1.model)("Blog", blogSchema);
exports.Blog = Blog;
//# sourceMappingURL=blogModel.js.map