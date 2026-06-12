import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

const lessonSchema = new Schema(
  {
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
        validator: function (v: string) {
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
  },
  { timestamps: true },
);

/**
 * Infer base type from schema (no duplication!)
 */
type LessonType = InferSchemaType<typeof lessonSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Instance methods
 */
interface LessonMethods {
  getDurationInMinutes(this: LessonDoc): number;
}

/**
 * Statics
 */
interface LessonStatics {
  findByModule(this: LessonModel, moduleId: string): Promise<LessonDoc[]>;
  findByCourse(this: LessonModel, courseId: string): Promise<LessonDoc[]>;
  getCompletedCount(this: LessonModel, courseId: string, userId: string): Promise<number>;
}

type LessonDoc = HydratedDocument<LessonType, LessonMethods>;
type LessonModel = Model<LessonType, {}, LessonMethods> & LessonStatics;

/**
 * Methods
 */
lessonSchema.methods.getDurationInMinutes = function (this: LessonDoc) {
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
lessonSchema.statics.findByModule = function (moduleId: string) {
  return this.find({ moduleId }).sort({ lessonIndex: 1 });
};

lessonSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId }).sort({ lessonIndex: 1 });
};

lessonSchema.statics.getCompletedCount = async function (courseId: string, userId: string) {
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
lessonSchema.pre<Query<LessonDoc[], LessonDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Lesson = model<LessonType, LessonModel>("Lesson", lessonSchema);

export { Lesson, LessonType, LessonDoc, LessonModel };
