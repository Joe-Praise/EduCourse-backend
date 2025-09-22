import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from 'mongoose';
import { Course } from './courseModel.js';

/**
 * 1. Define schema (single source of truth)
 */
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
    createdAt: {
      type: Date,
      default: Date.now,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * 2. Infer base type from schema (no duplication!)
 */
type CompletedCourseType = InferSchemaType<typeof completedcourseSchema> & { _id: Types.ObjectId };

/**
 * 3. Define instance methods
 */
interface CompletedCourseMethods {
  getTotalLessonsCompleted(this: CompletedCourseDoc): number;
  getCompletionPercentage(this: CompletedCourseDoc, totalLessons: number): number;
}

/**
 * 4. Define statics
 */
interface CompletedCourseStatics {
  totalNumberOfStudents(courseId: Types.ObjectId): Promise<void>;
  findByCourse(courseId: string): Promise<CompletedCourseDoc[]>;
  findByUser(userId: string): Promise<CompletedCourseDoc[]>;
}

/**
 * 5. Combine into document & model types
 */
type CompletedCourseDoc = HydratedDocument<CompletedCourseType, CompletedCourseMethods>;
type CompletedCourseModel = Model<CompletedCourseType, {}, CompletedCourseMethods> & CompletedCourseStatics;

/**
 * 6. Add methods
 */
completedcourseSchema.methods.getTotalLessonsCompleted = function (this: CompletedCourseDoc) {
  return this.lessonsCompleted.length;
};

completedcourseSchema.methods.getCompletionPercentage = function (this: CompletedCourseDoc, totalLessons: number) {
  if (totalLessons === 0) return 0;
  return Math.round((this.lessonsCompleted.length / totalLessons) * 100);
};

/**
 * 7. Add statics
 */
completedcourseSchema.statics.totalNumberOfStudents = async function (
  courseId: Types.ObjectId,
): Promise<void> {
  const stats = await this.aggregate([
    {
      $match: { courseId },
    },
    {
      $count: 'studentsQuantity',
    },
  ]);

  const studentsQuantity = stats.length > 0 ? stats[0].studentsQuantity : 0;
  
  await Course.findByIdAndUpdate(courseId, {
    studentsQuantity,
  });
};

completedcourseSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId });
};

completedcourseSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId });
};

/**
 * 8. Add indexes
 */
completedcourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
completedcourseSchema.index({ courseId: 1 });
completedcourseSchema.index({ userId: 1 });

/**
 * 8. Add indexes
 */
completedcourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });
completedcourseSchema.index({ courseId: 1 });
completedcourseSchema.index({ userId: 1 });

/**
 * 9. Add middleware (typed this)
 */
completedcourseSchema.pre(/^find/, function (this: Query<CompletedCourseDoc, CompletedCourseDoc>) {
  this.find({ active: { $ne: false } });
});

completedcourseSchema.pre(/^find/, function (this: Query<CompletedCourseDoc, CompletedCourseDoc>) {
  this.populate({
    path: 'userId',
    select: '-__v -password',
  });

  this.populate({
    path: 'courseId',
    select: '-__v',
  });
});

completedcourseSchema.post(/^find/, function (this: Query<CompletedCourseDoc, CompletedCourseDoc>) {
  this.populate({
    path: 'courseId',
    select: '-__v',
  });
});

/**
 * 10. Add post-save middleware for automatic student count updates
 */
completedcourseSchema.post('save', function (this: CompletedCourseDoc) {
  (this.constructor as CompletedCourseModel).totalNumberOfStudents(this.courseId);
});

completedcourseSchema.pre<Query<CompletedCourseDoc, CompletedCourseDoc>>(/^findOneAnd/, async function () {
  (this as any).r = await this.clone().findOne();
});

completedcourseSchema.post<Query<CompletedCourseDoc, CompletedCourseDoc>>(/^findOneAnd/, async function () {
  if ((this as any).r) {
    await ((this as any).r.constructor as CompletedCourseModel).totalNumberOfStudents((this as any).r.courseId);
  }
});

/**
 * 11. Create and export model
 */
export const CompletedCourse = model<CompletedCourseDoc, CompletedCourseModel>(
  'CompletedCourse',
  completedcourseSchema,
);

// Export types for use in other files
export type { CompletedCourseDoc, CompletedCourseModel, CompletedCourseType };

export default CompletedCourse;
