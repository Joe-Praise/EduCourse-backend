const mongoose = require('mongoose');

const { Schema } = mongoose;

const blogCommentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A blog comment must have a user!'],
    },
    blogId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Blog',
      required: [true, 'A blog comment must have a blog!'],
    },
    review: {
      type: String,
      required: [true, 'A blog must have a review!'],
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

blogCommentSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const BlogComment = mongoose.model('BlogComment', blogCommentSchema);
module.exports = BlogComment;
