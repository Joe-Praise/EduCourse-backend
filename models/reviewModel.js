const mongoose = require('mongoose');
const Course = require('./courseModel');

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must have a user'],
    },
    courseId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: [true, 'A review must have a course'],
    },
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: { type: Date, default: Date.now() },
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

reviewSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({
    path: 'userId',
    select: '-__v -password',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (courseId) {
  const stats = await this.aggregate([
    {
      $match: { courseId },
    },
    {
      $group: {
        _id: '$courseId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length) {
    await Course.findByIdAndUpdate(courseId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// it calculates the average when the document is being saved
reviewSchema.post('save', function () {
  // this points to current review document
  this.constructor.calcAverageRatings(this.courseId);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // get the current review document before /^findOneAnd/ save it to this.r
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  // get the document before save and save it to this.r
  //   this.r = await this.findOne();
  await this.r.constructor.calcAverageRatings(this.r.courseId);
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
