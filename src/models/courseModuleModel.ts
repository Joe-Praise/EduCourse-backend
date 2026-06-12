import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

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

type CourseModuleType = InferSchemaType<typeof courseModuleSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
type CourseModuleDoc = HydratedDocument<CourseModuleType>;
type CourseModuleModel = Model<CourseModuleType, {}, {}>;

courseModuleSchema.index({ courseId: 1 });

courseModuleSchema.virtual('lessons', {
  ref: 'Lesson',
  foreignField: 'moduleId',
  localField: '_id',
});

<<<<<<< HEAD:models/courseModuleModel.ts
// courseSchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'courseId',
//   localField: '_id',
// });

courseModuleSchema.pre(/^find/, function (next: () => void) {
  (this as any).find({ active: { $ne: false } });

  (this as any).populate({
    path: 'lessons',
    select: '-__v',
  });
=======
courseModuleSchema.pre<Query<CourseModuleDoc[], CourseModuleDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({ path: 'lessons', select: '-__v' });
>>>>>>> e78b148218335e7cc3b2ea58283d17dc29aa7626:src/models/courseModuleModel.ts
  next();
});

const CourseModule = model<CourseModuleType, CourseModuleModel>('Module', courseModuleSchema);

export { CourseModule, CourseModuleType, CourseModuleDoc, CourseModuleModel };
