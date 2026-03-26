"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = void 0;
const mongoose_1 = require("mongoose");
/**
 * 1. Define schema (single source of truth)
 */
const lessonSchema = new mongoose_1.Schema({
    moduleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Module',
        required: [true, 'A lesson must have a module!'],
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            message: 'Invalid URL format'
        }
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
    completed: {
        type: Boolean,
        default: false,
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
lessonSchema.methods.markCompleted = async function () {
    this.completed = true;
    return await this.save();
};
lessonSchema.methods.markIncomplete = async function () {
    this.completed = false;
    return await this.save();
};
lessonSchema.methods.getDurationInMinutes = function () {
    // Parse duration string like "5:30" or "10 minutes"
    const duration = this.duration.toLowerCase();
    if (duration.includes(':')) {
        const [minutes, seconds] = duration.split(':').map(Number);
        return minutes + (seconds / 60);
    }
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
};
/**
 * 7. Add statics
 */
lessonSchema.statics.findByModule = function (moduleId) {
    return this.find({ moduleId }).sort({ lessonIndex: 1 });
};
lessonSchema.statics.findByCourse = function (courseId) {
    return this.find({ courseId }).sort({ lessonIndex: 1 });
};
lessonSchema.statics.getCompletedCount = async function (courseId) {
    const count = await this.countDocuments({ courseId, completed: true });
    return count;
};
/**
 * 8. Add indexes
 */
lessonSchema.index({ moduleId: 1, lessonIndex: 1 });
lessonSchema.index({ courseId: 1 });
lessonSchema.index({ lessonIndex: 1 });
/**
 * 9. Export model
 */
const Lesson = (0, mongoose_1.model)("Lesson", lessonSchema);
exports.Lesson = Lesson;
//# sourceMappingURL=lessonModel.js.map