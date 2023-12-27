const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'A category must have a name'],
  },
  group: {
    type: String,
    required: [true, 'category is required!'],
    enum: {
      values: ['course', 'blog'],
      message: 'group is eithier: course, blog',
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

categorySchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
