import { Schema, model, } from 'mongoose';
const quizSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    moduleIndex: {
        type: Number,
        required: true,
    },
    /**
     * `pending`  → trigger fired, awaiting callback
     * `ready`    → callback received, `questions` populated
     * `failed`   → agent run failed; client should retry
     */
    status: {
        type: String,
        enum: { values: ['pending', 'ready', 'failed'], message: 'Invalid status' },
        default: 'pending',
        required: true,
    },
    questions: [
        {
            question: { type: String, required: true },
            options: {
                type: [String],
                validate: {
                    validator: (v) => Array.isArray(v) && v.length === 4,
                    message: 'A quiz question must have exactly 4 options',
                },
            },
            answer: {
                type: Number,
                min: 0,
                max: 3,
                required: true,
            },
        },
    ],
    generatedAt: {
        type: Date,
        default: Date.now,
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
quizSchema.index({ courseId: 1, moduleIndex: 1 }, { unique: true });
// Soft-delete filter — every find/findOne ignores docs with active: false
quizSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
const Quiz = model('Quiz', quizSchema);
export { Quiz };
//# sourceMappingURL=quizModel.js.map