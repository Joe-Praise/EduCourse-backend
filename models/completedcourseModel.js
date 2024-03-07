const mongoose = require('mongoose');
const Course = require('./courseModel');

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
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    active: {
      type: Boolean,
      default: true,
    },
    lessonsCompleted: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Lesson',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

completedcourseSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

completedcourseSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userId',
    select: '-__v -password',
  });

  // this.populate({
  //   path: 'courseId',
  //   select: '-__v',
  // });
  next();
});

// TODO: this should count total number of students registered to a course
// run the aggregate to update the course model student field from here

completedcourseSchema.statics.totalNumberOfStudents = async function (
  courseId,
) {
  const stats = await this.aggregate([
    {
      $match: { courseId },
    },
    {
      $count: 'studentsQuantity',
    },
  ]);

  if (stats.length) {
    await Course.findByIdAndUpdate(courseId, {
      studentsQuantity: stats[0].studentsQuantity,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      studentsQuantity: stats[0].studentsQuantity,
    });
  }
};

// it calculates the totalNumberOfStudents when the document is being saved
completedcourseSchema.post('save', function () {
  // this points to current review document
  this.constructor.totalNumberOfStudents(this.courseId);
});

// findByIdAndUpdate
// findByIdAndDelete
completedcourseSchema.pre(/^findOneAnd/, async function (next) {
  // get the current completed course document before /^findOneAnd/ save it to this.r
  this.r = await this.findOne();
  next();
});

completedcourseSchema.post(/^findOneAnd/, async function (next) {
  // get the document before save and save it to this.r
  //   this.r = await this.findOne();
  await this.r.constructor.totalNumberOfStudents(this.r.courseId);
  next();
});

const CompletedCourse = mongoose.model(
  'CompletedCourse',
  completedcourseSchema,
);
module.exports = CompletedCourse;
