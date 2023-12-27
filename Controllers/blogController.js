const sharp = require('sharp');
const Blog = require('../models/blogModel');
const catchAsync = require('../utils/catchAsync');
const upload = require('../utils/handleImageUpload');
const {
  getAll,
  getOne,
  updateOne,
  createOne,
  deleteOne,
} = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.createBlog = createOne(Blog, { field: 'title' });
exports.getAllBlog = getAll(Blog);
exports.getBlog = getOne(Blog, { path: 'comments' });
exports.updateBlog = updateOne(Blog);
exports.deleteBlog = deleteOne(Blog);

exports.setCoverImage = upload.single('imageCover');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `blog-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(700, 700)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/blog/${req.file.filename}`);

  next();
});

exports.uploadResources = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('This route is for only resources.', 400));
  }

  req.body.imageCover = req.file.filename;

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedBlog,
    },
  });
});
