import { Schema, model } from "mongoose";
const lessonSchema = new Schema({
    moduleId: {
        type: Schema.Types.ObjectId,
        ref: 'Module',
        required: [true, 'A lesson must have a module!'],
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'A lesson must have a course!'],
    },
    url: {
        type: String,
        required: [true, 'A lesson must have a url'],
        validate: {
            validator: function (v) {
                const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
                return urlRegex.test(v);
            },
            message: 'Invalid URL format',
        },
    },
    title: {
        type: String,
        required: [true, 'A lesson must have title'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    duration: {
        type: String,
        required: [true, 'A lesson must have duration'],
    },
    lessonIndex: {
        type: Number,
        required: [true, 'A lesson must have a lesson index!'],
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
lessonSchema.methods.getDurationInMinutes = function () {
    const duration = this.duration.toLowerCase();
    if (duration.includes(':')) {
        const [minutes, seconds] = duration.split(':').map(Number);
        return minutes + seconds / 60;
    }
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
};
/**
 * Statics
 */
lessonSchema.statics.findByModule = function (moduleId) {
    return this.find({ moduleId }).sort({ lessonIndex: 1 });
};
lessonSchema.statics.findByCourse = function (courseId) {
    return this.find({ courseId }).sort({ lessonIndex: 1 });
};
lessonSchema.statics.getCompletedCount = async function (courseId, userId) {
    // Completion is per-user, tracked in CompletedCourse.lessonsCompleted
    // This method signature now accepts userId for correct per-user counts
    const { CompletedCourse } = await import('./completedcourseModel.js');
    const enrollment = await CompletedCourse.findOne({ courseId, userId });
    return enrollment ? enrollment.lessonsCompleted.length : 0;
};
/**
 * Indexes
 */
lessonSchema.index({ moduleId: 1, lessonIndex: 1 });
lessonSchema.index({ courseId: 1 });
lessonSchema.index({ lessonIndex: 1 });
/**
 * Middleware
 */
lessonSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
const Lesson = model("Lesson", lessonSchema);
export { Lesson };
//# sourceMappingURL=lessonModel.js.map