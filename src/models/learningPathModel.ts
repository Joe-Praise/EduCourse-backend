import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

const learningPathSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    /**
     * `pending`  → trigger fired, awaiting callback
     * `ready`    → callback received, `path` populated
     * `failed`   → agent run failed; client should retry
     */
    status: {
      type: String,
      enum: { values: ['pending', 'ready', 'failed'], message: 'Invalid status' },
      default: 'pending',
      required: true,
    },
    path: [
      {
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        order: { type: Number, required: true },
        reason: { type: String },
      },
    ],
    estimatedWeeks: { type: Number },
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

// Compound index for the "most recent paths for this user" query.
learningPathSchema.index({ userId: 1, createdAt: -1 });
// Single-field userId index for general lookups (covers `find({ userId })` w/o sort).
learningPathSchema.index({ userId: 1 });

type LearningPathType = InferSchemaType<typeof learningPathSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
type LearningPathDoc = HydratedDocument<LearningPathType>;
type LearningPathModel = Model<LearningPathType>;

// Soft-delete filter — every find/findOne ignores docs with active: false
learningPathSchema.pre<Query<LearningPathDoc[], LearningPathDoc>>(
  /^find/,
  function (next) {
    this.find({ active: { $ne: false } });
    next();
  },
);

const LearningPath = model<LearningPathType, LearningPathModel>(
  'LearningPath',
  learningPathSchema,
);

export { LearningPath, LearningPathType, LearningPathDoc, LearningPathModel };
