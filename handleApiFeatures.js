const catchAsync = require('./utils/catchAsync');

exports.apiFeaturesFunc = catchAsync(() => {
  // exports.getAllTours = catchAsync(async (req, res, next) => {
  //   //     console.log(req.query);
  //   // BUILD QUERY
  //   // 1A) Filtering
  //   // const queryObj = { ...req.query };
  //   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //   // excludedFields.forEach((el) => delete queryObj[el]);
  //   // // 1B) Advanced Filtering
  //   // let queryStr = JSON.stringify(queryObj);
  //   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  //   // // console.log(JSON.parse(queryStr));
  //   // let query = Tour.find(JSON.parse(queryStr));
  //   // 2) Sorting
  //   // if (req.query.sort) {
  //   //   const sortBy = req.query.sort.split(',').join(' ');
  //   //   // console.log(sortBy);
  //   //   query = query.sort(sortBy);
  //   // } else {
  //   //   query = query.sort('-createdAt');
  //   // }
  //   // 3) Fields Limiting
  //   // if (req.query.fields) {
  //   //   const fields = req.query.fields.split(',').join(' ');
  //   //   query = query.select(fields);
  //   // } else {
  //   //   query = query.select('-__v');
  //   // }
  //   // 4) Pagination
  //   // const page = req.query.page * 1 || 1;
  //   // const limit = req.query.limit * 1 || 100;
  //   // const skip = (page - 1) * limit;
  //   // query = query.skip(skip).limit(limit);
  //   // if (req.query.page) {
  //   //   const numTours = await Tour.countDocuments();
  //   //   if (skip >= numTours) throw new Error('This page does not exist');
  //   // }
});
