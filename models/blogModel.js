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
    tag: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tag',
      required: [true, 'A blog must have a tag!'],
    },
    title: {
      type: String,
      required: [true, 'A blog must have a title!'],
    },
    imageCover: {
      type: String,
      required: [true, 'A blog must have cover image!'],
    },
    description: {
      type: String,
      required: [true, 'A blog must have description!'],
    },
    summary: {
      type: String,
      required: [true, 'A blog must have summary!'],
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
  next();
});

blogSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
