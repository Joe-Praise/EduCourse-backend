import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

const recommendationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    /**
     * `pending`  → trigger fired, awaiting callback
     * `ready`    → callback received, `recommendations` populated
     * `failed`   → agent run failed; client should retry
     */
    status: {
      type: String,
      enum: { values: ['pending', 'ready', 'failed'], message: 'Invalid status' },
      default: 'pending',
      required: true,
    },
    recommendations: [
      {
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        reason: { type: String },
        order: { type: Number },
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

type RecommendationType = InferSchemaType<typeof recommendationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
type RecommendationDoc = HydratedDocument<RecommendationType>;
type RecommendationModel = Model<RecommendationType>;

// Soft-delete filter — every find/findOne ignores docs with active: false
recommendationSchema.pre<Query<RecommendationDoc[], RecommendationDoc>>(
  /^find/,
  function (next) {
    this.find({ active: { $ne: false } });
    next();
  },
);

const Recommendation = model<RecommendationType, RecommendationModel>(
  'Recommendation',
  recommendationSchema,
);

export { Recommendation, RecommendationType, RecommendationDoc, RecommendationModel };
