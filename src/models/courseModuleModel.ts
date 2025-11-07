import {Schema, model, HydratedDocument, Model, InferSchemaType, Query} from 'mongoose';

const courseModuleSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'A course module must have a course!'],
    },
    title: {
      type: String,
      required: [true, 'A course module must have a title!'],
    },
    moduleIndex: {
      type: Number,
      required: [true, 'A course module must have a module index!'],
    },
    section: {
      type: String,
      required: [true, 'A course module must have a section'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

courseModuleSchema.index({ courseId: 1 });

type CourseModuleType = InferSchemaType<typeof courseModuleSchema> & { _id: Schema.Types.ObjectId };
type CourseModuleDoc = HydratedDocument<CourseModuleType>;
type CourseModuleModel = Model<CourseModuleType, {}, {}>;

courseModuleSchema.virtual('lessons', {
  ref: 'Lesson',
  foreignField: 'moduleId',
  localField: '_id',
});

// courseSchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'courseId',
//   localField: '_id',
// });

courseModuleSchema.pre<Query<CourseModuleDoc[], CourseModuleDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'lessons',
    select: '-__v',
  });
  next();
});

const CourseModule = model<CourseModuleType, CourseModuleModel>('Module', courseModuleSchema);
export {CourseModule, CourseModuleType, CourseModuleDoc, CourseModuleModel};
