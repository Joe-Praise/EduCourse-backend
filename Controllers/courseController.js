const sharp = require('sharp');
// const axios = require('axios');
const Course = require('../models/courseModel');
const Review = require('../models/reviewModel');
const CompletedCourse = require('../models/completedcourseModel');
const {
  createOne,
  updateOne,
  deleteOne,
  searchModel,
} = require('./handlerFactory');
const upload = require('../utils/handleImageUpload');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const Pagination = require('../utils/paginationFeatures');

// const ATLAS_API_BASE_URL = 'https://cloud.mongodb.com/api/atlas/v2';
// const ATLAS_PROJECT_ID = process.env.MONGODB_ATLAS_PROJECT_ID;
// const ATLAS_CLUSTER_NAME = process.env.MONGODB_ATLAS_CLUSTER;
// const ATLAS_CLUSTER_API_URL = `${ATLAS_API_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`;
// const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/fts/indexes`;

// const ATLAS_API_PUBLIC_KEY = process.env.MONGODB_ATLAS_PUBLIC_KEY;
// const ATLAS_API_PRIVATE_KEY = process.env.MONGODB_ATLAS_PRIVATE_KEY;
// const DIGEST_AUTH = `${ATLAS_API_PUBLIC_KEY}:${ATLAS_API_PRIVATE_KEY}`;

const COURSE_SEARCH_INDEX = 'courseSearch';
const COURSE_AUTOCOMPLETE_INDEX_NAME = 'courseAutocomplete';

// async function findIndexByName(indexName) {
//   const allIndexesResponse = await request(
//     `${ATLAS_SEARCH_INDEX_API_URL}/${MONGODB_DATABASE}/${MONGODB_COLLECTION}`,
//     {
//       dataType: 'json',
//       contentType: 'application/json',
//       method: 'GET',
//       digestAuth: DIGEST_AUTH,
//     },
//   );

//   return allIndexesResponse.data.find((i) => i.name === indexName);
// }

// async function upsertSearchIndex() {
//   const userSearchIndex = await findIndexByName(USER_SEARCH_INDEX_NAME);
//   if (!userSearchIndex) {
//     await request(ATLAS_SEARCH_INDEX_API_URL, {
//       data: {
//         name: USER_SEARCH_INDEX_NAME,
//         database: MONGODB_DATABASE,
//         collectionName: MONGODB_COLLECTION,
//         // https://www.mongodb.com/docs/atlas/atlas-search/index-definitions/#syntax
//         mappings: {
//           dynamic: true,
//         },
//       },
//       dataType: 'json',
//       contentType: 'application/json',
//       method: 'POST',
//       digestAuth: DIGEST_AUTH,
//     });
//   }
// }

// async function upsertAutocompleteIndex() {
//   const userAutocompleteIndex = await findIndexByName(
//     USER_AUTOCOMPLETE_INDEX_NAME,
//   );
//   if (!userAutocompleteIndex) {
//     await request(ATLAS_SEARCH_INDEX_API_URL, {
//       data: {
//         name: USER_AUTOCOMPLETE_INDEX_NAME,
//         database: MONGODB_DATABASE,
//         collectionName: MONGODB_COLLECTION,
//         // https://www.mongodb.com/docs/atlas/atlas-search/autocomplete/#index-definition
//         mappings: {
//           dynamic: false,
//           fields: {
//             fullName: [
//               {
//                 foldDiacritics: false,
//                 maxGrams: 7,
//                 minGrams: 3,
//                 tokenization: 'edgeGram',
//                 type: 'autocomplete',
//               },
//             ],
//           },
//         },
//       },
//       dataType: 'json',
//       contentType: 'application/json',
//       method: 'POST',
//       digestAuth: DIGEST_AUTH,
//     });
//   }
// }

// async function main() {
//   try {
//     await mongoClient.connect();

//     await upsertSearchIndex();
//     await upsertAutocompleteIndex();

//     app.listen(3001, () =>
//       console.log('http://localhost:3001/search?query=gilbert'),
//     );
//   } catch (err) {
//     console.log(err);
//   }

//   process.on('SIGTERM', async () => {
//     await mongoClient.close();
//     process.exit(0);
//   });
// }

// main();

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

exports.atlasSearchCourse = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const pipeline = [];

  if (!query || query.length < 2) {
    return res.status(200).json({
      status: 'success',
      data: [],
    });
  }

  pipeline.push({
    $search: {
      index: COURSE_SEARCH_INDEX,
      text: {
        query,
        path: ['title', 'description'],
        fuzzy: {},
      },
    },
  });

  pipeline.push({
    $project: {
      score: { $meta: 'searchScore' },
      title: 1,
      imageCover: 1,
      instructors: 1,
    },
  });

  const result = await Course.aggregate(pipeline).sort({ score: -1 }).limit(10);
  // const array = await result.toArray();
  // console.log(result);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.atlasAutocomplete = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const pipeline = [];

  if (!query || query.length < 2) {
    return res.status(200).json({
      status: 'success',
      data: [],
    });
  }

  pipeline.push({
    $search: {
      index: COURSE_AUTOCOMPLETE_INDEX_NAME,
      autocomplete: {
        query,
        path: 'title',
        tokenOrder: 'sequential',
      },
    },
  });

  pipeline.push({
    $project: {
      score: { $meta: 'searchScore' },
      title: 1,
      imageCover: 1,
      instructors: 1,
    },
  });

  const result = await Course.aggregate(pipeline).sort({ score: -1 }).limit(10);
  // const array = await result.toArray();
  // console.log(result);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.getAllCourses = catchAsync(async (req, res, next) => {
  const { slug, userId } = req.query;

  let query;
  if (slug) {
    query = Course.find({ slug });
    let isEnrolled = false;

    const doc = await query;

    const reviews = await Review.find({ courseId: doc[0]._id });

    const ratingSummary = calculateRating(reviews);

    doc[0].active = undefined;
    const copy = doc[0]._doc;

    const data = [{ ...copy, ratingSummary }];

    if (userId) {
      const isUserEnrolled = await CompletedCourse.find({
        userId,
        courseId: doc[0]._id,
      });
      isEnrolled = !!isUserEnrolled.length;
    }
    res.status(200).json({
      status: 'success',
      isEnrolled: isEnrolled,
      data,
    });
  } else {
    // used to identify fields to run mongoose reference search on
    const referencedProperties = ['instructors', 'category'];
    const features = new APIFeatures(Course.find(), req.query)
      .filter(referencedProperties)
      .sorting()
      .limitFields();

    query = await features.query;

    const paginate = new Pagination(req.query).pagination(query);

    // do not retrun active status as response
    // doc.active = undefined;
    res.status(200).json({
      status: 'success',
      metaData: paginate.metaData,
      data: paginate.data,
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

exports.getLectureCourse = catchAsync(async (req, res, next) => {
  const { userId, courseId } = req.params;
  const path = 'reviews';

  if (!userId && !courseId) {
    return next(new AppError('Provide required params!', 404));
  }

  const exists = await CompletedCourse.find({
    userId,
    courseId,
  });

  if (!exists.length) {
    return next(new AppError('Register for course to get access!', 400));
  }

  const doc = await Course.findById(courseId).populate(path);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  const reviews = await Review.find({ courseId });

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

exports.searchCourses = searchModel(Course);

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
