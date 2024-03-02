const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide course title!'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please provide course description!'],
    },
    imageCover: {
      type: String,
    },
    level: {
      type: String,
      enum: {
        values: ['All Levels'],
        message: 'Skill is either: All levels',
      },
    },
    // language: {
    //   type: String,
    //   required: [true, 'Course language is required!'],
    // },
    instructors: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Instructor',
        required: [true, 'instructor name is required!'],
      },
    ],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'A course must have a category!'],
    },
    duration: {
      type: String,
      required: [true, 'A course must have a duration'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      Set: (val) => Math.round(val * 10) / 10,
    },
    ratingSummary: [
      {
        type: Number,
      },
    ],
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A course must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        // this only points to current doc on new document creation
        validator: function (val) {
          return val <= this.price;
        },
        message:
          'Discount price({VALUE}) should be below or equal to the regular price',
      },
    },
    priceCategory: {
      type: String,
      required: [true, 'A course must have a price category'],
      enum: {
        values: ['Free', 'Paid'],
        message: 'Price category is either: Free, Paid',
        default: 'Free',
      },
    },
    studentsQuantity: { type: Number, default: 0 },
    active: {
      type: Boolean,
      default: true,
      select: false,
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

courseSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'courseId',
  localField: '_id',
});

courseSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'instructors',
    select: '-__v',
  });

  this.populate({
    path: 'category',
    select: '-__v',
  });

  next();
});

courseSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
