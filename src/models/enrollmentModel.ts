import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';
import AppError from '../utils/appError.js';
import { Course } from './courseModel.js';
import { CompletedCourse, CompletedCourseDoc } from './completedcourseModel.js';
import {
  InstructorEarning,
  InstructorEarningDoc,
  calculateEarningSplit,
} from './instructorEarningModel.js';
import { Notification, NotificationDoc } from './notificationModel.js';

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
  enrollUser(this: EnrollmentModel, input: EnrollUserInput): Promise<EnrollUserResult>;
}

interface EnrollUserInput {
  userId: string | Types.ObjectId;
  courseId: string | Types.ObjectId;
  paymentRef?: string;
}

/** Documents created by `enrollUser`; `null` where nothing needed creating. */
interface EnrollUserResult {
  enrollment: EnrollmentDoc;
  completedCourse: CompletedCourseDoc | null;
  earning: InstructorEarningDoc | null;
  notification: NotificationDoc;
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
 * Enrolls a user in a course atomically. The enrollment, the My Learning
 * progress record, the instructor's earning and the confirmation notification
 * are written in ONE transaction: either all exist afterwards or none do.
 *
 * Callers emit cache events only after this resolves, so caches are never
 * invalidated for writes that were rolled back.
 */
enrollmentSchema.statics.enrollUser = async function (
  { userId, courseId, paymentRef }: EnrollUserInput,
): Promise<EnrollUserResult> {
  let result: EnrollUserResult | undefined;

  // `transaction()` retries the callback on transient errors, so every
  // attempt rebuilds `result` from scratch.
  await this.db.transaction(async (session) => {
    const course = await Course.findById(courseId)
      .select('price priceDiscount instructors')
      .session(session);
    if (!course) {
      throw new AppError('No published course found with that ID', 404);
    }

    const existing = await this.findOne({ userId, courseId }).session(session);
    if (existing) {
      throw new AppError('User is already enrolled in this course', 409);
    }

    const [enrollment] = await this.create([{ userId, courseId, paymentRef }], { session });

    // Progress record backing the My Learning page.
    let completedCourse: CompletedCourseDoc | null = null;
    const hasProgress = await CompletedCourse.findOne({ userId, courseId }).session(session);
    if (!hasProgress) {
      [completedCourse] = await CompletedCourse.create([{ userId, courseId }], { session });
    }

    // The lead (first-listed) instructor is paid for the sale, at the price
    // the student actually pays.
    let earning: InstructorEarningDoc | null = null;
    const amount = course.getDiscountedPrice();
    const leadInstructor = course.instructors?.[0] as
      | Types.ObjectId
      | { _id: Types.ObjectId }
      | undefined;
    const instructorId =
      leadInstructor instanceof Types.ObjectId ? leadInstructor : leadInstructor?._id;

    if (instructorId && amount > 0) {
      [earning] = await InstructorEarning.create(
        [
          {
            instructorId,
            courseId,
            enrollmentId: enrollment._id,
            amount,
            ...calculateEarningSplit(amount),
          },
        ],
        { session },
      );
    }

    const [notification] = await Notification.create(
      [
        {
          userId,
          type: 'enrollment',
          title: 'Enrollment Confirmed',
          message: 'You have successfully enrolled in the course.',
          link: '/my-courses/learning',
        },
      ],
      { session },
    );

    result = { enrollment, completedCourse, earning, notification };
  });

  return result as EnrollUserResult;
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

export {
  Enrollment,
  EnrollmentType,
  EnrollmentDoc,
  EnrollmentModel,
  EnrollUserInput,
  EnrollUserResult,
};
