import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

const enrollmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Enrollment must belong to a user'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Enrollment must belong to a course'],
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    paymentRef: {
      type: String,
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

type EnrollmentType = InferSchemaType<typeof enrollmentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

interface EnrollmentMethods {}

interface EnrollmentStatics {
  findByCourse(this: EnrollmentModel, courseId: string): Promise<EnrollmentDoc[]>;
  findByUser(this: EnrollmentModel, userId: string): Promise<EnrollmentDoc[]>;
  countByCourse(this: EnrollmentModel, courseId: string): Promise<number>;
}

type EnrollmentDoc = HydratedDocument<EnrollmentType, EnrollmentMethods>;
type EnrollmentModel = Model<EnrollmentType, {}, EnrollmentMethods> & EnrollmentStatics;

enrollmentSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId });
};

enrollmentSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId });
};

enrollmentSchema.statics.countByCourse = async function (courseId: string) {
  return this.countDocuments({ courseId });
};

/**
 * Indexes
 */
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ userId: 1 });

/**
 * Middleware — filter active, populate references
 */
enrollmentSchema.pre<Query<EnrollmentDoc[], EnrollmentDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({ path: 'userId', select: 'name photo email' });
  this.populate({ path: 'courseId', select: 'title price imageCover slug' });
  next();
});

const Enrollment = model<EnrollmentType, EnrollmentModel>('Enrollment', enrollmentSchema);

export { Enrollment, EnrollmentType, EnrollmentDoc, EnrollmentModel };
