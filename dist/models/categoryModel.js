"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
/**
 * 1. Define schema (single source of truth)
 */
const categorySchema = new mongoose_1.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
/**
 * 6. Add methods
 */
categorySchema.methods.isCourseCategory = function () {
    return this.group === 'course';
};
categorySchema.methods.isBlogCategory = function () {
    return this.group === 'blog';
};
/**
 * 7. Add statics
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
 * 8. Add indexes
 */
categorySchema.index({ name: 1, group: 1 }, { unique: true });
categorySchema.index({ group: 1 });
/**
 * 9. Middleware (typed this)
 */
categorySchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
/**
 * 10. Export model
 */
const Category = (0, mongoose_1.model)("Category", categorySchema);
exports.Category = Category;
//# sourceMappingURL=categoryModel.js.map