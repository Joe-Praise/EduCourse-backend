"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instructor = void 0;
const mongoose_1 = require("mongoose");
/**
 * 1. Define schema (single source of truth)
 */
const instructorSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Instructor must be a user'],
    },
    title: {
        type: String,
        required: [true, 'Instructor must have a title'],
    },
    description: {
        type: String,
        required: [true, 'Instructor should have a description'],
        default: 'I am an instructor, i have my course coming soon',
    },
    links: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Link'
        }],
    expertise: {
        type: String,
        required: [true, 'Instructor expertise is required!'],
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * 6. Add methods
 */
instructorSchema.methods.getFullProfile = async function () {
    return await this.populate(['userId', 'links']);
};
instructorSchema.methods.addLink = async function (linkId) {
    if (!this.links.includes(linkId)) {
        this.links.push(linkId);
        return await this.save();
    }
    return this;
};
instructorSchema.methods.removeLink = async function (linkId) {
    this.links = this.links.filter(link => link.toString() !== linkId);
    return await this.save();
};
/**
 * 7. Add statics
 */
instructorSchema.statics.findByUser = function (userId) {
    return this.findOne({ userId });
};
instructorSchema.statics.findByExpertise = function (expertise) {
    return this.find({ expertise: new RegExp(expertise, 'i') });
};
/**
 * 8. Add indexes
 */
instructorSchema.index({ userId: 1 }, { unique: true });
instructorSchema.index({ expertise: 1 });
/**
 * 9. Add virtuals
 */
instructorSchema.virtual('courses', {
    ref: 'Course',
    foreignField: 'instructors',
    localField: '_id',
});
/**
 * 10. Middleware (typed this)
 */
instructorSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({
        path: 'userId',
        select: '-__v -passwordChangedAt -password',
    });
    this.populate({
        path: 'links',
        select: '-__v -userId',
    });
    next();
});
/**
 * 11. Export model
 */
const Instructor = (0, mongoose_1.model)("Instructor", instructorSchema);
exports.Instructor = Instructor;
//# sourceMappingURL=instructorModel.js.map