import { Schema, model } from "mongoose";
const instructorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    channelId: {
        type: String,
    },
    channelName: {
        type: String,
    },
    // YouTube channel profile fields — populated for `source: 'youtube'`
    // instructors (which have no linked User). The frontend reads these
    // directly so user-less instructors still render an avatar/bio/link.
    channelThumbnailUrl: {
        type: String,
    },
    channelUrl: {
        type: String,
    },
    subscriberCount: {
        type: Number,
    },
    source: {
        type: String,
        enum: ['user', 'youtube'],
        default: 'user',
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
            type: Schema.Types.ObjectId,
            ref: 'Link',
        }],
    expertise: {
        type: String,
        required: [true, 'Instructor expertise is required!'],
    },
    totalStudents: {
        type: Number,
        default: 0,
    },
    totalRevenue: {
        type: Number,
        default: 0,
    },
    totalCourses: {
        type: Number,
        default: 0,
    },
    rating: {
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
 * Statics
 */
instructorSchema.statics.findByUser = function (userId) {
    return this.findOne({ userId });
};
instructorSchema.statics.findByExpertise = function (expertise) {
    return this.find({ expertise: new RegExp(expertise, 'i') });
};
/**
 * Indexes
 *
 * userId / channelId use PARTIAL unique indexes (not `sparse`). A sparse index
 * still indexes documents whose field is explicitly `null` — and a plain
 * unique index treats a *missing* field as null too, so only ONE doc could
 * lack the field. That broke YouTube-imported instructors (no `userId`) and
 * user-created instructors (no `channelId`): the first claimed the null slot,
 * every subsequent one hit E11000. A partialFilterExpression scoped by `$type`
 * means uniqueness is enforced ONLY for real values; user-less / channel-less
 * docs are excluded from the index entirely.
 */
instructorSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });
instructorSchema.index({ channelId: 1 }, { unique: true, partialFilterExpression: { channelId: { $type: 'string' } } });
instructorSchema.index({ expertise: 1 });
/**
 * Virtuals
 */
instructorSchema.virtual('courses', {
    ref: 'Course',
    foreignField: 'instructors',
    localField: '_id',
});
/**
 * Middleware
 */
instructorSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'userId', select: '-__v -passwordChangedAt -password' });
    this.populate({ path: 'links', select: '-__v -userId' });
    next();
});
const Instructor = model("Instructor", instructorSchema);
export { Instructor };
//# sourceMappingURL=instructorModel.js.map