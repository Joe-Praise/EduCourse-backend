const mongoose = require('mongoose');

const { Schema } = mongoose;

const linkModelSchema = new Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Link must belong to a user!'],
  },
  platform: {
    type: String,
    enum: {
      values: ['Facebook', 'X', 'Pintrest', 'Instagram', 'YouTube'],
      message:
        'platform should be between Facebook, X, Pintrest, Instagram, YouTube',
    },
    required: [true, 'Link requires a specified platform'],
  },
  url: {
    type: String,
    required: [true, 'Please provide a url to your profile!'],
  },
});

const Link = mongoose.model('Link', linkModelSchema);
module.exports = Link;
