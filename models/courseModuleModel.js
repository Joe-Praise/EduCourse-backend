const mongoose = require('mongoose');

const { Schema } = mongoose;

const courseModuleSchema = new Schema(
  {
    courseId: {
      type: mongoose.Schema.ObjectId,
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

courseModuleSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'lessons',
    select: '-__v',
  });
  next();
});

const Module = mongoose.model('Module', courseModuleSchema);
module.exports = Module;
