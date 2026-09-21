import { Schema, model } from "mongoose";
import slugify from "slugify";
const blogSchema = new Schema({
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'A blog must have a category!'],
    },
    slug: String,
    tag: [
        {
            type: Schema.Types.ObjectId,
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
blogSchema.methods.generateExcerpt = function (length = 150) {
    return this.description.length > length
        ? this.description.substring(0, length) + '...'
        : this.description;
};
blogSchema.methods.isPublished = function () {
    return this.active !== false;
};
/**
 * Statics
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
 * Indexes
 */
blogSchema.index({ title: 'text', description: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ tag: 1 });
/**
 * Virtuals
 */
blogSchema.virtual('comments', {
    ref: 'BlogComment',
    foreignField: 'blogId',
    localField: '_id',
});
/**
 * Middleware
 */
blogSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'category', select: '-__v' });
    this.populate({ path: 'tag', select: '-__v' });
    next();
});
blogSchema.pre('save', function (next) {
    this.slug = slugify(this.title, { lower: true });
    next();
});
const Blog = model("Blog", blogSchema);
export { Blog };
//# sourceMappingURL=blogModel.js.map