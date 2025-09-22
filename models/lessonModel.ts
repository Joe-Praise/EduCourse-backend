import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types
} from "mongoose";

/**
 * 1. Define schema (single source of truth)
 */
const lessonSchema = new Schema({
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
      validator: function(v: string) {
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
 * 2. Infer base type from schema (no duplication!)
 */
type LessonType = InferSchemaType<typeof lessonSchema> & { _id: Types.ObjectId }

/**
 * 3. Define instance methods
 */
interface LessonMethods {
  markCompleted(this: LessonDoc): Promise<LessonDoc>;
  markIncomplete(this: LessonDoc): Promise<LessonDoc>;
  getDurationInMinutes(this: LessonDoc): number;
}

/**
 * 4. Define statics
 */
interface LessonStatics {
  findByModule(this: LessonModel, moduleId: string): Promise<LessonDoc[]>;
  findByCourse(this: LessonModel, courseId: string): Promise<LessonDoc[]>;
  getCompletedCount(this: LessonModel, courseId: string): Promise<number>;
}

/**
 * 5. Combine into document & model types
 */
type LessonDoc = HydratedDocument<LessonType, LessonMethods>;
type LessonModel = Model<LessonType, {}, LessonMethods> & LessonStatics;

/**
 * 6. Add methods
 */
lessonSchema.methods.markCompleted = async function (this: LessonDoc) {
  this.completed = true;
  return await this.save();
};

lessonSchema.methods.markIncomplete = async function (this: LessonDoc) {
  this.completed = false;
  return await this.save();
};

lessonSchema.methods.getDurationInMinutes = function (this: LessonDoc) {
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
lessonSchema.statics.findByModule = function (moduleId: string) {
  return this.find({ moduleId }).sort({ lessonIndex: 1 });
};

lessonSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId }).sort({ lessonIndex: 1 });
};

lessonSchema.statics.getCompletedCount = async function (courseId: string) {
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
const Lesson = model<LessonType, LessonModel>("Lesson", lessonSchema);

export { Lesson, LessonType, LessonDoc, LessonModel };
