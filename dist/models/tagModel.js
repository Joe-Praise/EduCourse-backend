"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const mongoose_1 = require("mongoose");
/**
 * 1. Define schema (single source of truth)
 */
const tagSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'A tag must have name!'],
        unique: true,
        trim: true,
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
tagSchema.methods.getSlug = function () {
    return this.name.toLowerCase().replace(/\s+/g, '-');
};
/**
 * 7. Add statics
 */
tagSchema.statics.findByName = function (name) {
    return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
};
tagSchema.statics.findOrCreate = async function (name) {
    let tag = await this.findByName(name);
    if (!tag) {
        tag = await this.create({ name });
    }
    return tag;
};
/**
 * 8. Add indexes
 */
tagSchema.index({ name: 1 });
/**
 * 9. Add virtuals
 */
tagSchema.virtual('blogs', {
    ref: 'Blog',
    foreignField: 'tag',
    localField: '_id',
});
/**
 * 10. Middleware (typed this)
 */
tagSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
/**
 * 11. Export model
 */
const Tag = (0, mongoose_1.model)("Tag", tagSchema);
exports.Tag = Tag;
//# sourceMappingURL=tagModel.js.map