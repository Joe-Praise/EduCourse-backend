import type { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import catchAsync from '../utils/catchAsync.js';
import  AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { formatDate } from '../utils/timeConverter.js';
import {
  createOne,
  updateOne,
  deleteOne,
} from './handlerFactory.js';

// Import CommonJS modules
import { Course } from "../models/courseModel.js";
import { Review } from "../models/reviewModel.js";
import { CourseModule } from "../models/courseModuleModel.js";
import { CompletedCourse } from "../models/completedcourseModel.js";
// import {cache} from '../config/cache.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id: string;
    [key: string]: any;
  };
}

// Constants
const COURSE_AUTOCOMPLETE_INDEX_NAME = 'courseAutocomplete';

interface ReviewDocument {
  rating: number;
  [key: string]: any;
}

interface RatingsSummary {
  title: string;
  value: number;
}

interface RatingsObject {
  [key: string]: number;
}

/**
 * Helper function to sum object values
 */
const addNumbers = (obj: RatingsObject): number => {
  return Object.values(obj).reduce((acc, value) => acc + value, 0);
};

/**
 * Calculate rating percentages from raw rating counts
 */
const calculatePercentage = (ratings: RatingsObject): RatingsSummary[] => {
  const ratingsTotal = addNumbers(ratings);
  if (ratingsTotal === 0) {
    return Object.keys(ratings).map(key => ({ title: key, value: 0 }));
  }

  const aveRating = Object.entries(ratings).map(([key, value]) => ({
    title: key,
    value: (value / ratingsTotal) * 100,
  }));

  return aveRating.sort((a, b) => parseInt(b.title, 10) - parseInt(a.title, 10));
};

/**
 * Calculate rating distribution from review array
 */
const calculateRating = (array: ReviewDocument[]): RatingsSummary[] => {
  // Default rating structure if no reviews
  if (array.length < 1) {
    return [
      { title: '5', value: 0 },
      { title: '4', value: 0 },
      { title: '3', value: 0 },
      { title: '2', value: 0 },
      { title: '1', value: 0 },
    ];
  }

  const starsAverage: RatingsObject = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  
  array.forEach(review => {
    const rating = Math.floor(review.rating);
    const key = rating.toString();
    if (key in starsAverage) {
      starsAverage[key] += 1;
    }
  });

  return calculatePercentage(starsAverage);
};


export const atlasAutocomplete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { q } = req.query;
  const pipeline: any[] = [];

  // Validate query parameter
  if (!q || typeof q !== 'string' || q.length < 2) {
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

export const getAllCourses = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { slug, userId } = req.query;

  const cacheKey = CacheKeyBuilder.listKey("course", req.query);
  const cachedResult = await cacheManager.get(cacheKey);
  
  if(cachedResult){
    return res.status(200).json({
      status:'success',
      metaData: cachedResult.metaData,
      data: cachedResult.data,
    })
  }

  let query: any;
  if (slug) {
    query = Course.find({ slug });
    let isEnrolled = false;

    const doc = await query;

    // getting all modules related to the course to get the total lessons for that course
    // i didnt use aggregate cause lessons is pre populated when we /^find/
    const modules = await CourseModule.find({ courseId: doc[0]._id });

    // get the total no of lessons
    const totalLessons = modules.flatMap((module: any) => module.lessons).length;

    const reviews = await Review.find({ courseId: doc[0]._id });

    const ratingSummary = calculateRating(reviews);

    // removing active from the fields returned
    (doc[0] as any).active = undefined;
    const copy = (doc[0] as any)._doc;

    copy.createdAt = formatDate(doc[0].createdAt);

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

    const paginate = new Pagination(req.query).paginate(query);

    let doc = paginate.data;

    doc = doc.map((el: any) => ({
      ...el._doc,
      createdAt: formatDate(el.createdAt),
    }));

    // Prepare the complete response structure for caching
    const responseData = {
      metaData: paginate.metaData,
      data: doc,
    };

    // cache the complete response structure
    await cacheManager.set(cacheKey, responseData);

    // do not retrun active status as response
    // doc.active = undefined;
    res.status(200).json({
      status: 'success',
      ...responseData
    });
  }
});

// exports.getCourse = getOne(Course, { path: 'reviews' });
export const getCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const cacheKey = CacheKeyBuilder.resourceKey("course", id);
  const cachedResult = await cacheManager.get(cacheKey)
  
  if(cachedResult){
    return res.status(200).json({
      status:'success',
      data: cachedResult,
    })
  }

  const path = 'reviews';
  const doc = await Course.findById(id).populate(path);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  const reviews = await Review.find({ courseId: id });

  const ratingSummary = calculateRating(reviews);

  (doc as any).active = undefined;
  const copy = (doc as any)._doc;
  const data = [{ ...copy, ratingSummary }];

  if (data) {
    await cacheManager.set(cacheKey, data);
  }

  res.status(200).json({
    status: 'success',
    data,
  });
});

export const getLectureCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

  (doc as any).active = undefined;
  const copy = (doc as any)._doc;
  const data = [{ ...copy, ratingSummary }];

  res.status(200).json({
 status: 'success',
    data,
  });
});

export const getMyLearningCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { completed } = req.query;

  if (!userId) {
    return next(new AppError('Provide required params!', 404));
  }

  /**
   * check the value of completed and assign it a queryObj according to it's value
   */
  let searchQuery: any;
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

  // throw error if none is found
  if (!exists.length) {
    return next(new AppError('No course found!', 400));
  }

  const courseArr = exists.flatMap((el: any) => el.courseId._id);

  (req.query as any).completed = undefined;

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

  const paginate = new Pagination(req.query).paginate(query);

  let doc = paginate.data;

  doc = doc.map((el: any) => ({
    ...el._doc,
    createdAt: formatDate(el.createdAt),
  }));

  res.status(200).json({
    status: 'success',
    metaData: paginate.metaData,
    data: doc,
  });
});

export const searchMyLearningCourse = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { q } = req.query;
  const userId = req.user!._id;

  if (!userId) {
    return next(new AppError('Provide required params!', 404));
  }

  if (!q || typeof q !== 'string') {
    return next(new AppError('Search query is required!', 400));
  }

  // get all courses user has applied for
  const exists = await CompletedCourse.find({
    userId,
  });

  // throw error if none is found
  if (!exists.length) {
    return next(new AppError('Could not find any course!.', 400));
  }

  const courseArr = exists.flatMap((el: any) => el.courseId._id);
  // console.log(courseArr);

  const doc = await Course.find(
    { $and: [{ _id: { $in: courseArr } }, { $text: { $search: q } }] },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .lean();

  let data = doc.map((el: any) => {
    const { active, ...courseData } = el;
    return {
      ...courseData,
      createdAt: formatDate(courseData.createdAt),
    };
  });
  res.status(200).json({
    status: 'success',
    data,
  });
});

// Base CRUD operations from handlerFactory
export const createCourse = createOne(Course, { field: 'title', cachePattern:CacheEvent.COURSE.CREATED});
export const updateCourse = updateOne(Course, {cachePattern: CacheEvent.COURSE.UPDATED});
export const deleteCourse = deleteOne(Course, {cachePattern: CacheEvent.COURSE.DELETED});


// Multer configuration should be defined elsewhere
// export const setCoverImage = upload.single('imageCover');

export const resizePhoto = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  (req.file as any).filename = `course-${req.user!.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(800, 800)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/course/${(req.file as any).filename}`);

  next();
});

export const uploadResources = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('This route is for only resources.', 400));
  }

  req.body.imageCover = (req.file as any).filename;

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
