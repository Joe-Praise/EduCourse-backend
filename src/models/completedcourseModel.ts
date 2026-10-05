import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
  ClientSession,
} from 'mongoose';
import { Course } from './courseModel.js';

const completedcourseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Completed course must belong to a user!'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Completed course must belong to an existing course!'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lessonsCompleted: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Infer base type from schema (no duplication!)
 */
type CompletedCourseType = InferSchemaType<typeof completedcourseSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Instance methods
 */
interface CompletedCourseMethods {
  getTotalLessonsCompleted(this: CompletedCourseDoc): number;
  getCompletionPercentage(this: CompletedCourseDoc, totalLessons: number): number;
}

/**
 * Statics
 */
interface CompletedCourseStatics {
  totalNumberOfStudents(courseId: Types.ObjectId, session?: ClientSession | null): Promise<void>;
  findByCourse(courseId: string): Promise<CompletedCourseDoc[]>;
  findByUser(userId: string): Promise<CompletedCourseDoc[]>;
}

type CompletedCourseDoc = HydratedDocument<CompletedCourseType, CompletedCourseMethods>;
type CompletedCourseModel = Model<CompletedCourseType, {}, CompletedCourseMethods> &
  CompletedCourseStatics;

/**
 * Methods
 */
completedcourseSchema.methods.getTotalLessonsCompleted = function (this: CompletedCourseDoc) {
  return this.lessonsCompleted.length;
};

completedcourseSchema.methods.getCompletionPercentage = function (
  this: CompletedCourseDoc,
  totalLessons: number,
) {
  if (totalLessons === 0) return 0;
  return Math.round((this.lessonsCompleted.length / totalLessons) * 100);
};

/**
 * Statics
 */
completedcourseSchema.statics.totalNumberOfStudents = async function (
  courseId: Types.ObjectId,
  session: ClientSession | null = null,
): Promise<void> {
  // Runs inside the caller's transaction when one is active, so the count
  // includes the not-yet-committed CompletedCourse that triggered it.
  const stats = await this.aggregate([
    { $match: { courseId } },
    { $count: 'studentsQuantity' },
  ]).session(session);

  const studentsQuantity = stats.length > 0 ? stats[0].studentsQuantity : 0;
  await Course.findByIdAndUpdate(courseId, { studentsQuantity }, { session });
};

completedcourseSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId });
};

completedcourseSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId });
};

/**
 * Indexes
 */
completedcourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
completedcourseSchema.index({ courseId: 1 });
completedcourseSchema.index({ userId: 1 });

/**
 * Middleware — single pre-find hook: filter inactive + populate
 */
completedcourseSchema.pre<Query<CompletedCourseDoc[], CompletedCourseDoc>>(
  /^find/,
  function (next) {
    this.find({ active: { $ne: false } });
    this.populate({ path: 'userId', select: '-__v -password' });
    this.populate({ path: 'courseId', select: '-__v' });
    next();
  },
);

/**
 * Post-save hook: update denormalised student count on Course
 */
completedcourseSchema.post('save', async function (this: CompletedCourseDoc) {
  await (this.constructor as CompletedCourseModel).totalNumberOfStudents(
    this.courseId,
    this.$session(),
  );
});

completedcourseSchema.pre<Query<CompletedCourseDoc, CompletedCourseDoc>>(
  /^findOneAnd/,
  async function () {
    (this as any).r = await this.clone().findOne();
  },
);

completedcourseSchema.post<Query<CompletedCourseDoc, CompletedCourseDoc>>(
  /^findOneAnd/,
  async function () {
    if ((this as any).r) {
      await (
        (this as any).r.constructor as CompletedCourseModel
      ).totalNumberOfStudents((this as any).r.courseId);
    }
  },
);

/**
 * Model — first generic is the raw schema type, not the hydrated document
 */
export const CompletedCourse = model<CompletedCourseType, CompletedCourseModel>(
  'CompletedCourse',
  completedcourseSchema,
);

export type { CompletedCourseDoc, CompletedCourseModel, CompletedCourseType };
