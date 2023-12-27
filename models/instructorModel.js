const mongoose = require('mongoose');

const { Schema } = mongoose;

const instructorSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Instructor must be a user'],
  },
  links: [{ type: String }],
  active: { type: Boolean, default: true, select: false },
});

instructorSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({
    path: 'userId',
    select: '-__v -passwordChangedAt -password',
  });
  next();
});

const Instructor = mongoose.model('Instructor', instructorSchema);
module.exports = Instructor;
