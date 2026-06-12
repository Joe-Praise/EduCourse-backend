import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

const quizSchema = new Schema(
  {
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
            validator: (v: string[]) => Array.isArray(v) && v.length === 4,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

quizSchema.index({ courseId: 1, moduleIndex: 1 }, { unique: true });

type QuizType = InferSchemaType<typeof quizSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
type QuizDoc = HydratedDocument<QuizType>;
type QuizModel = Model<QuizType>;

// Soft-delete filter — every find/findOne ignores docs with active: false
quizSchema.pre<Query<QuizDoc[], QuizDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Quiz = model<QuizType, QuizModel>('Quiz', quizSchema);

export { Quiz, QuizType, QuizDoc, QuizModel };
