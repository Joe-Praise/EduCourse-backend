import { Schema, model } from "mongoose";
const linkSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
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
            message: 'URL must be a valid HTTP or HTTPS URL',
        },
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
}, { timestamps: true });
/**
 * Methods
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
 * Statics
 */
linkSchema.statics.findByUser = function (userId) {
    return this.find({ userId });
};
linkSchema.statics.findByPlatform = function (platform) {
    return this.find({ platform });
};
/**
 * Indexes
 */
linkSchema.index({ userId: 1, platform: 1 }, { unique: true });
linkSchema.index({ platform: 1 });
const Link = model("Link", linkSchema);
export { Link };
//# sourceMappingURL=linkModel.js.map