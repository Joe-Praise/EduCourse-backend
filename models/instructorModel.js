const mongoose = require('mongoose');

const { Schema } = mongoose;

const instructorSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Instructor must be a user'],
    },
    description: {
      type: String,
      required: [true, 'Instructor should have a description'],
      default: 'I am an instructor, i have my course coming soon',
    },
    links: [{ type: mongoose.Schema.ObjectId, ref: 'Link' }],
    active: { type: Boolean, default: true, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

instructorSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({
    path: 'userId',
    select: '-__v -passwordChangedAt -password',
  });

  this.populate({
    path: 'links',
    select: '-__v -userId',
  });

  next();
});

const Instructor = mongoose.model('Instructor', instructorSchema);
module.exports = Instructor;
