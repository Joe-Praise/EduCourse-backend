const sharp = require('sharp');
const Course = require('../models/courseModel');
const Review = require('../models/reviewModel');
const { createOne, updateOne, deleteOne } = require('./handlerFactory');
const upload = require('../utils/handleImageUpload');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const addNumbers = (obj) => {
  const sum = Object.entries(obj).reduce((acc, [, value]) => {
    acc += value;
    return acc;
  }, 0);
  return sum;
};

const calculatePercentage = (ratings) => {
  const ratingsTotal = addNumbers(ratings);
  const aveRating = [];

  Object.entries(ratings).map(([key, value]) =>
    aveRating.push({ title: key, value: (value / ratingsTotal) * 100 }),
  );

  const sortedRating = aveRating.sort(
    (a, b) => parseInt(b.title, 10) - parseInt(a.title, 10),
  );
  return sortedRating;
};

const calculateRating = (array) => {
  // if no review, return
  if (array.length < 1)
    return [
      { title: 5, value: 0 },
      { title: 4, value: 0 },
      { title: 3, value: 0 },
      { title: 2, value: 0 },
      { title: 1, value: 0 },
    ];
  const data = array;

  const starsAverage = data
    .flatMap((review) => review.rating)
    .reduce(
      (acc, cur) => {
        switch (Math.floor(cur)) {
          case 5:
            acc['5'] += 1;
            return acc;
          case 4:
            acc['4'] += 1;
            return acc;
          case 3:
            acc['3'] += 1;
            return acc;
          case 2:
            acc['2'] += 1;
            return acc;
          case 1:
            acc['1'] += 1;
            return acc;
          default:
            return acc;
        }
      },
      {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    );

  const averageRatings = calculatePercentage(starsAverage);

  return averageRatings;
};

exports.getAllCourses = catchAsync(async (req, res, next) => {
  const { slug } = req.query;
  let { page, limit } = req.query;

  // console.log(page, limit);
  let query;
  if (slug) {
    query = Course.find({ slug });

    const doc = await query;

    const reviews = await Review.find({ courseId: doc[0]._id });

    const ratingSummary = calculateRating(reviews);

    doc[0].active = undefined;
    const copy = doc[0]._doc;

    const data = [{ ...copy, ratingSummary }];

    res.status(200).json({
      status: 'success',
      data,
    });
  } else {
    page = Number(page) || 1;
    limit = Number(limit) || 6;

    // handle pagonation
    //   query = Model.aggregate([
    //     {
    //       $facet: {
    //         metaData: [
    //           {
    //             $count: 'totalDocuments',
    //           },
    //           {
    //             $addFields: {
    //               pageNumber: page,
    //               totalPages: {
    //                 $ceil: { $divide: ['$totalDocuments', limit] },
    //               },
    //             },
    //           },
    //         ],
    //         data: [
    //           {
    //             $skip: (page - 1) * limit,
    //           },
    //           {
    //             $limit: limit,
    //           },
    //         ],
    //       },
    //     },
    //     {
    //       $lookup:{

    //       }
    //     }
    //   ]);
    // }

    query = Course.find()
      .skip((page - 1) * limit)
      .limit(limit);

    const doc = await query;

    const metaData = {
      page,
      count: doc.length,
      limit,
    };

    // do not retrun active status as response
    // doc.active = undefined;
    res.status(200).json({
      status: 'success',
      metaData,
      data: doc,
    });
  }
});

// exports.getCourse = getOne(Course, { path: 'reviews' });
exports.getCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const path = 'reviews';
  const doc = await Course.findById(id).populate(path);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  const reviews = await Review.find({ courseId: id });

  const ratingSummary = calculateRating(reviews);

  doc.active = undefined;
  const copy = doc._doc;
  const data = [{ ...copy, ratingSummary }];

  res.status(200).json({
    status: 'success',
    data,
  });
});

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
