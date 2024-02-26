const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'A blog must have a category!'],
    },
    slug: String,
    tag: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tag',
      },
    ],
    title: {
      type: String,
      required: [true, 'A blog must have a title!'],
    },
    imageCover: {
      type: String,
    },
    description: {
      type: String,
      required: [true, 'A blog must have description!'],
    },
    summary: {
      type: String,
      required: [true, 'A blog must have summary!'],
    },
    commentsQuantity: {
      type: Number,
      default: 0,
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

blogSchema.virtual('comments', {
  ref: 'BlogComment',
  foreignField: 'blogId',
  localField: '_id',
});

blogSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  this.populate({
    path: 'category',
    select: '-__v',
  });

  this.populate({
    path: 'tag',
    select: '-__v',
  });
  next();
});

blogSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
