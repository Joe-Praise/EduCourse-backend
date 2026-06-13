import { Schema, model, } from 'mongoose';
const courseModuleSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'A course module must have a course!'],
    },
    title: {
        type: String,
        required: [true, 'A course module must have a title!'],
    },
    moduleIndex: {
        type: Number,
        required: [true, 'A course module must have a module index!'],
    },
    section: {
        type: String,
        required: [true, 'A course module must have a section'],
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
courseModuleSchema.index({ courseId: 1 });
courseModuleSchema.virtual('lessons', {
    ref: 'Lesson',
    foreignField: 'moduleId',
    localField: '_id',
});
courseModuleSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'lessons', select: '-__v' });
    next();
});
const CourseModule = model('Module', courseModuleSchema);
export { CourseModule };
//# sourceMappingURL=courseModuleModel.js.map