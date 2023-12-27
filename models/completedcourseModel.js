const mongoose = require('mongoose');

const { Schema } = mongoose;

const completedcourseSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Completed course must belong to a user!'],
    },
    courseId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: [true, 'Completed coures must belong to an existing course!'],
    },
    completed: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

completedcourseSchema.pre(/^find/, function (next) {
  this.find({ completed: { $ne: false } });
  next();
});

completedcourseSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userId',
    select: '-__v -password',
  });

  this.populate({
    path: 'courseId',
    select: '-__v',
  });
  next();
});

// TODO: this should count total number of students registered to a course
// run the aggregate to update the course model student field from here

const CompletedCourse = mongoose.model(
  'CompletedCourse',
  completedcourseSchema,
);
module.exports = CompletedCourse;
