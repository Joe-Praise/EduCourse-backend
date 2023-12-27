const sharp = require('sharp');
const Course = require('../models/courseModel');
const {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} = require('./handlerFactory');
const upload = require('../utils/handleImageUpload');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllCourses = getAll(Course);
exports.getCourse = getOne(Course, { path: 'reviews' });
exports.createCourse = createOne(Course, { field: 'title' });
exports.updateCourse = updateOne(Course);
exports.deleteCourse = deleteOne(Course);

exports.setCoverImage = upload.single('imageCover');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `course-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(700, 700)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/course/${req.file.filename}`);

  next();
});

exports.uploadResources = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('This route is for only resources.', 400));
  }

  req.body.imageCover = req.file.filename;

  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedCourse,
    },
  });
});
