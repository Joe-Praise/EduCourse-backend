"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = void 0;
const mongoose_1 = require("mongoose");
/**
 * 1. Define schema (single source of truth)
 */
const linkSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Link must belong to a user!'],
    },
    platform: {
        type: String,
        enum: {
            values: ['Facebook', 'X', 'Pinterest', 'Instagram', 'YouTube', 'LinkedIn', 'Website'],
            message: 'platform should be between Facebook, X, Pinterest, Instagram, YouTube, LinkedIn, Website',
        },
        required: [true, 'Link requires a specified platform'],
    },
    url: {
        type: String,
        required: [true, 'Please provide a url to your profile!'],
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'URL must be a valid HTTP or HTTPS URL'
        }
    },
    displayName: {
        type: String,
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
linkSchema.methods.isValid = function () {
    return /^https?:\/\/.+/.test(this.url);
};
linkSchema.methods.getDomain = function () {
    try {
        return new URL(this.url).hostname;
    }
    catch {
        return '';
    }
};
/**
 * 7. Add statics
 */
linkSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
linkSchema.statics.findByPlatform = function (platform) {
    return this.find({ platform });
};
/**
 * 8. Add indexes
 */
linkSchema.index({ userId: 1, platform: 1 }, { unique: true });
linkSchema.index({ platform: 1 });
/**
 * 9. Export model
 */
const Link = (0, mongoose_1.model)("Link", linkSchema);
exports.Link = Link;
//# sourceMappingURL=linkModel.js.map