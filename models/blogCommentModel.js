const mongoose = require('mongoose');
const Blog = require('./blogModel');

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

// TODO: this should count total number of comments registered to a blog
// run the aggregate to update the blog model comment quantity field from here

blogCommentSchema.statics.totalNumberOfComments = async function (blogId) {
  const stats = await this.aggregate([
    {
      $match: { blogId },
    },
    {
      $count: 'commentsQuantity',
    },
  ]);

  if (stats.length) {
    await Blog.findByIdAndUpdate(blogId, {
      commentsQuantity: stats[0].commentsQuantity,
    });
  } else {
    await Blog.findByIdAndUpdate(blogId, {
      commentsQuantity: stats[0].commentsQuantity,
    });
  }
};

// it calculates the totalNumberOfComments when the document is being saved
blogCommentSchema.post('save', function () {
  // this points to current blog document
  this.constructor.totalNumberOfComments(this.blogId);
});

// findByIdAndUpdate
// findByIdAndDelete
blogCommentSchema.pre(/^findOneAnd/, async function (next) {
  // get the current blog comment document before /^findOneAnd/ save it to this.r
  this.r = await this.findOne();
  next();
});

blogCommentSchema.post(/^findOneAnd/, async function (next) {
  // get the document before save and save it to this.r
  //   this.r = await this.findOne();
  await this.r.constructor.totalNumberOfComments(this.r.blogId);
  next();
});

blogCommentSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'userId',
    select: '-__v',
  });
  this.populate({
    path: 'blogId',
    select: 'commentsQuantity _id',
  });
  next();
});

const BlogComment = mongoose.model('BlogComment', blogCommentSchema);
module.exports = BlogComment;
