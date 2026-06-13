import { Schema, model } from "mongoose";
const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'A category must have a name'],
    },
    group: {
        type: String,
        required: [true, 'category is required!'],
        enum: {
            values: ['course', 'blog'],
            message: 'group is either: course, blog',
        },
    },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
}, { timestamps: true });
/**
 * Methods
 */
categorySchema.methods.isCourseCategory = function () {
    return this.group === 'course';
};
categorySchema.methods.isBlogCategory = function () {
    return this.group === 'blog';
};
/**
 * Statics
 */
categorySchema.statics.findByGroup = function (group) {
    return this.find({ group });
};
categorySchema.statics.findCourseCategories = function () {
    return this.find({ group: 'course' });
};
categorySchema.statics.findBlogCategories = function () {
    return this.find({ group: 'blog' });
};
/**
 * Indexes
 */
categorySchema.index({ name: 1, group: 1 }, { unique: true });
categorySchema.index({ group: 1 });
/**
 * Middleware
 */
categorySchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
const Category = model("Category", categorySchema);
export { Category };
//# sourceMappingURL=categoryModel.js.map