const mongoose = require('mongoose');

const { Schema } = mongoose;

const tagSchema = new Schema({
  name: {
    type: String,
    required: [true, 'A tag must have name!'],
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

tagSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;
