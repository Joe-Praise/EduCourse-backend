// const { default: mongoose } = require('mongoose');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const sharp = require('sharp');
// const axios = require('axios');
dayjs.extend(relativeTime);
const Course = require('../models/courseModel');
const Review = require('../models/reviewModel');
const Module = require('../models/courseModuleModel');
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

// const COURSE_SEARCH_INDEX = 'courseSearch';
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

// exports.atlasSearchCourse = catchAsync(async (req, res, next) => {
//   const { query } = req.query;
//   const pipeline = [];

//   if (!query || query.length < 2) {
//     return res.status(200).json({
//       status: 'success',
//       data: [],
//     });
//   }

//   pipeline.push({
//     $search: {
//       index: COURSE_SEARCH_INDEX,
//       text: {
//         query,
//         path: ['title', 'description'],
//         fuzzy: {},
//       },
//     },
//   });

//   pipeline.push({
//     $project: {
//       score: { $meta: 'searchScore' },
//       title: 1,
//       imageCover: 1,
//       instructors: 1,
//     },
//   });

//   const result = await Course.aggregate(pipeline).sort({ score: -1 }).limit(10);
//   // const array = await result.toArray();
//   // console.log(result);

//   res.status(200).json({
//     status: 'success',
//     data: result,
//   });
// });

exports.atlasAutocomplete = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  const pipeline = [];

  if (!q || q.length < 2) {
    return res.status(200).json({
      status: 'success',
      data: [],
    });
  }

  pipeline.push({
    $search: {
      index: COURSE_AUTOCOMPLETE_INDEX_NAME,
      autocomplete: {
        query: q,
        path: 'title',
        tokenOrder: 'sequential',
        fuzzy: {},
      },
    },
  });

  // pipeline.push({
  //   $match: {
  //     _id: {
  //       $in: [
  //         new mongoose.Schema.ObjectId('658b21288ddbe097bcde5e93'),
  //         new mongoose.Schema.ObjectId('65d462eacd08454eaff677af'),
  //       ],
  //     },
  //   },
  // });

  pipeline.push({
    $project: {
      score: { $meta: 'searchScore' },
      title: 1,
      imageCover: 1,
      slug: 1,
    },
  });

  const result = await Course.aggregate(pipeline).sort({ score: -1 }).limit(10);

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

    // getting all modules related to the course to get the total lessons for that course
    // i didnt use aggregate cause lessons is pre populated when we /^find/
    const modules = await Module.find({ courseId: doc[0]._id });

    // get the total no of lessons
    const totalLessons = modules.flatMap((lesson) => lesson.lessons).length;

    const reviews = await Review.find({ courseId: doc[0]._id });

    const ratingSummary = calculateRating(reviews);

    // removing active from the fields returned
    doc[0].active = undefined;
    const copy = doc[0]._doc;

    copy.createdAt = dayjs(doc[0].createdAt).format('MMMM D, YYYY');

    const data = [{ ...copy, ratingSummary, totalLessons }];

    // check if user is already enrolled for the course
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

    let doc = paginate.data;

    doc = doc.map((el) => ({
      ...el._doc,
      createdAt: dayjs(el.createdAt).format('MMMM D, YYYY'),
    }));

    // do not retrun active status as response
    // doc.active = undefined;
    res.status(200).json({
      status: 'success',
      metaData: paginate.metaData,
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

exports.getMyLearningCourse = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { completed } = req.query;

  if (!userId) {
    return next(new AppError('Provide required params!', 404));
  }

  /**
   * check the value of completed and assign it a queryObj according to it's value
   */
  let searchQuery;
  if (completed === 'inprogress') {
    searchQuery = {
      userId,
      completed: false,
    };
  } else if (completed === 'completed') {
    searchQuery = {
      userId,
      completed: true,
    };
  } else {
    searchQuery = { userId };
  }

  const exists = await CompletedCourse.find(searchQuery);

  // console.log(exists, searchQuery);
  // throw error if none is found
  if (!exists.length) {
    return next(new AppError('No course found!', 400));
  }

  const courseArr = exists.flatMap((el) => el.courseId._id);

  req.query.completed = undefined;

  const features = new APIFeatures(
    Course.find({
      _id: { $in: courseArr },
    }),
    req.query,
  )
    .filter()
    .sorting()
    .limitFields();

  const query = await features.query;

  const paginate = new Pagination(req.query).pagination(query);

  let doc = paginate.data;

  doc = doc.map((el) => ({
    ...el._doc,
    createdAt: dayjs(el.createdAt).format('MMMM D, YYYY'),
  }));

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: doc,
  });
});

exports.searchModel = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  const userId = req.user._id;

  if (!userId) {
    return next(new AppError('Provide required params!', 404));
  }

  // get all courses user has applied for
  const exists = await CompletedCourse.find({
    userId,
  });

  // throw error if none is found
  if (!exists.length) {
    return next(new AppError('Could not find any course!.', 400));
  }

  const courseArr = exists.flatMap((el) => el.courseId._id);
  // console.log(courseArr);

  const doc = await Course.find(
    { $and: [{ _id: { $in: courseArr } }, { $text: { $search: q } }] },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .lean();

  // pipeline.push({
  //   $match: {
  //     _id: {
  //       $in: [
  //         new mongoose.Schema.ObjectId('658b21288ddbe097bcde5e93'),
  //         new mongoose.Schema.ObjectId('65d462eacd08454eaff677af'),
  //       ],
  //     },
  //   },
  // });

  let data = doc._doc;

  data = doc.map((el) => ({
    ...el,
    createdAt: dayjs(el.createdAt).format('MMMM D, YYYY'),
  }));

  doc.active = undefined;
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
    .resize(800, 800)
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
