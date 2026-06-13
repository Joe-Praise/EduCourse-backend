import { Schema, model, Types, } from "mongoose";
const certificateSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "A certificate must belong to a user"],
    },
    courseId: {
        type: Types.ObjectId,
        ref: "Course",
        required: [true, "A certificate must belong to a course"],
    },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
}, { timestamps: true });
// One certificate per user per course
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
certificateSchema.methods.getLabel = function () {
    return `Certificate-${this._id}`;
};
certificateSchema.statics.findForUser = function (userId) {
    return this.find({ userId });
};
certificateSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
const Certificate = model("Certificate", certificateSchema);
export { Certificate };
//# sourceMappingURL=certificateModel.js.map