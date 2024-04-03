const Category = require('../models/categoryModel');
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
  // used middleware in completedCourse controller to ger this data
  const { registeredCourses } = req;

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
