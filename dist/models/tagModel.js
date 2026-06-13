import { Schema, model } from "mongoose";
const tagSchema = new Schema({
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
}, { timestamps: true });
/**
 * Methods
 */
tagSchema.methods.getSlug = function () {
    return this.name.toLowerCase().replace(/\s+/g, '-');
};
/**
 * Statics
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
 * Virtuals
 */
tagSchema.virtual('blogs', {
    ref: 'Blog',
    foreignField: 'tag',
    localField: '_id',
});
/**
 * Middleware
 */
tagSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
const Tag = model("Tag", tagSchema);
export { Tag };
//# sourceMappingURL=tagModel.js.map