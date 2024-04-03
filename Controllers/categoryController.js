const Category = require('../models/categoryModel');
const CompletedCourse = require('../models/completedcourseModel');
const catchAsync = require('../utils/catchAsync');
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require('./handlerFactory');

exports.getAllCategory = getAll(Category);

exports.getMyLearningCategory = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const registeredCourses = await CompletedCourse.find({ userId });

  const getCategoryId = registeredCourses.map(
    (course) => course.courseId.category._id,
  );

  const category = await Category.find({ _id: { $in: getCategoryId } });

  res.status(200).json({
    status: 'success',
    data: category,
  });
});

exports.getCategory = getOne(Category);

exports.createCategory = createOne(Category);

exports.updateCategory = updateOne(Category);

exports.deleteCategory = deleteOne(Category);
