const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(relativeTime);
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Instructor = require('../models/instructorModel');
const Blog = require('../models/blogModel');

const catchAsync = require('../utils/catchAsync');
const Pagination = require('../utils/paginationFeatures');

const FetchLandingPageData = async (query, limit) => {
  const queryString = { limit, page: 1 };
  const documents = await query.find().limit(limit).sort('-createdAt');

  const paginate = new Pagination(queryString).pagination(documents);

  let doc = paginate.data;

  doc = doc.map((el) => ({
    ...el._doc,
    createdAt: dayjs(el.createdAt).format('MMMM D, YYYY'),
  }));

  return doc;
};

exports.landingPage = catchAsync(async (req, res, next) => {
  const limit = 6;
  const instructorLimit = 4;

  const courses = await FetchLandingPageData(Course, limit);
  const blogs = await FetchLandingPageData(Blog, limit);
  const instructors = await FetchLandingPageData(Instructor, instructorLimit);

  const categories = await Category.find().limit(limit);

  res.status(200).json({
    status: 'success',
    data: {
      courses,
      blogs,
      instructors,
      categories,
    },
  });
});
