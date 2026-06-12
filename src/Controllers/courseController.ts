import { logger } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { uploadBufferToCloudinary } from '../utils/cloudinary.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { formatDate } from '../utils/timeConverter.js';
import { createOne, updateOne, deleteOne } from './handlerFactory.js';
import { safeTriggerAgent } from '../services/agentService.js';

// Import CommonJS modules
import { Course } from '../models/courseModel.js';
import { Review } from '../models/reviewModel.js';
import { CourseModule } from '../models/courseModuleModel.js';
import { CompletedCourse } from '../models/completedcourseModel.js';
import { Enrollment } from '../models/enrollmentModel.js';
// import {cache} from '../config/cache.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { appEvents } from '../events/index.js';
import { Notification } from '../models/notificationModel.js';

// Import cache events to register listeners
import '../events/cache/courseCache.events.js';

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
    return Object.keys(ratings).map((key) => ({ title: key, value: 0 }));
  }

  const aveRating = Object.entries(ratings).map(([key, value]) => ({
    title: key,
    value: (value / ratingsTotal) * 100,
  }));

  return aveRating.sort(
    (a, b) => parseInt(b.title, 10) - parseInt(a.title, 10),
  );
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

  const starsAverage: RatingsObject = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0,
  };

  array.forEach((review) => {
    const rating = Math.floor(review.rating);
    const key = rating.toString();
    if (key in starsAverage) {
      starsAverage[key] += 1;
    }
  });

  return calculatePercentage(starsAverage);
};

export const atlasAutocomplete = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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
        // Surface status so the UI can badge / guard AI-imported drafts that
        // are still being built (publishedStatus: 'importing').
        publishedStatus: 1,
      },
    });

    const result = await Course.aggregate(pipeline)
      .sort({ score: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  },
);

export const getAllCourses = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug, userId } = req.query;

    const cacheKey = CacheKeyBuilder.listKey('course', req.query);
    const cachedResult = await cacheManager.get(cacheKey);

    // if (cachedResult) {
    //   return res.status(200).json({
    //     status: 'success',
    //     metaData: cachedResult.metaData,
    //     data: cachedResult.data,
    //   });
    // }

    let query: any;
    if (slug) {
      query = Course.find({ slug });
      let isEnrolled = false;

      const doc = await query;

      // No course matches this slug (deleted, archived, or never existed).
      // Return 404 instead of crashing on `doc[0]._id` below.
      if (!doc || doc.length === 0 || !doc[0]?._id) {
        return next(new AppError('No course found with that slug', 404));
      }

      // getting all modules related to the course to get the total lessons for that course
      // i didnt use aggregate cause lessons is pre populated when we /^find/
      const modules = await CourseModule.find({ courseId: doc[0]._id });

      // get the total no of lessons
      const totalLessons = modules.flatMap(
        (module: any) => module.lessons,
      ).length;

      const reviews = await Review.find({ courseId: doc[0]._id });

      const ratingSummary = calculateRating(reviews);

      // removing active from the fields returned
      (doc[0] as any).active = undefined;
      const copy = (doc[0] as any)._doc;

      copy.createdAt = formatDate(doc[0].createdAt);

      const data = [{ ...copy, ratingSummary, totalLessons }];

      // check if user is already enrolled for the course (check both models for consistency)
      if (userId) {
        const [completedDoc, enrollmentDoc] = await Promise.all([
          CompletedCourse.findOne({ userId, courseId: doc[0]._id }),
          Enrollment.findOne({ userId, courseId: doc[0]._id }),
        ]);
        isEnrolled = !!completedDoc || !!enrollmentDoc;
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
      // logger.debug('🚀 ~ features:', features);

      query = await features.query;

      const paginate = new Pagination(req.query).paginate(query);
      // logger.debug('🚀 ~ paginate:', paginate);

      let doc = paginate.data;

      // If zero results and a search query is present, trigger YouTube discovery
      if (
        doc.length === 0 &&
        typeof req.query.search === 'string' &&
        req.query.search.trim().length >= 3
      ) {
        const searchQuery = req.query.search.trim();

        // Check for an existing draft with this query (avoid duplicate triggers)
        const existing = await Course.findOne({
          importQuery: searchQuery,
          publishedStatus: { $in: ['importing', 'published'] },
        }).setOptions({ skipPublishedFilter: true });

        if (existing) {
          return res.status(200).json({
            status: 'success',
            data: [(existing as any)._doc ?? existing],
            importing: existing.publishedStatus === 'importing',
          });
        }

        logger.info(
          `[import] no catalog match for "${searchQuery}" → creating draft + triggering YouTube discovery`,
        );

        const draft = await Course.create({
          title: searchQuery,
          description: `AI-imported course for "${searchQuery}". Importing from YouTube...`,
          publishedStatus: 'importing',
          importQuery: searchQuery,
          instructors: [],
          price: 0,
          priceCategory: 'Free',
        });

        logger.info(`[import] draft ${draft._id} created (status: importing)`);

        await safeTriggerAgent(
          'youtube-course-discovery',
          {
            initiatedBy: (req as AuthenticatedRequest).user
              ? `user:${(req as AuthenticatedRequest).user!._id}`
              : 'api',
            courseId: draft._id.toString(),
            courseQuery: searchQuery,
          },
          `search="${searchQuery}"`,
        );

        return res.status(202).json({
          status: 'success',
          data: [(draft as any)._doc ?? draft],
          importing: true,
          discoveryMessage: `Importing course on "${searchQuery}" from YouTube...`,
        });
      }

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
        ...responseData,
      });
    }
  },
);

// exports.getCourse = getOne(Course, { path: 'reviews' });
export const getCourse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const cacheKey = CacheKeyBuilder.resourceKey('course', id);
    const cachedResult = await cacheManager.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        status: 'success',
        data: cachedResult,
      });
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
  },
);

export const getLectureCourse = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId, userId: paramUserId } = req.params;
    const userId = req.user!._id;
    const path = 'reviews';

    if (!courseId) {
      return next(new AppError('Provide required params!', 400));
    }

    // Defense in depth: the URL `:userId` param must match the authenticated user.
    // The handler always uses `req.user._id` from the JWT, but rejecting mismatches
    // up front makes the API contract explicit and surfaces probing attempts in logs.
    if (paramUserId && paramUserId !== userId.toString()) {
      return next(new AppError('Forbidden', 403));
    }

    const [enrollment, completedCourse] = await Promise.all([
      Enrollment.findOne({ userId, courseId }),
      CompletedCourse.findOne({ userId, courseId }),
    ]);

    if (!enrollment && !completedCourse) {
      return next(new AppError('Register for course to get access!', 403));
    }

    // Self-heal: Enrollment exists but CompletedCourse was never created (data inconsistency)
    let effectiveCompleted = completedCourse;
    if (enrollment && !completedCourse) {
      effectiveCompleted = await CompletedCourse.create({ userId, courseId });
    }

    const doc = await Course.findById(courseId).populate(path);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    const reviews = await Review.find({ courseId });

    const ratingSummary = calculateRating(reviews);

    (doc as any).active = undefined;
    const copy = (doc as any)._doc;
    // Expose the user's per-course progress so the frontend can resume on the
    // last-viewed lesson rather than starting from lesson 1 every session,
    // and so it can PATCH /completed-courses/:id to mark lessons complete.
    const completedLessons = (effectiveCompleted?.lessonsCompleted ?? []).map(
      (id) => id.toString(),
    );
    const completedCourseId = effectiveCompleted?._id?.toString();
    const data = [
      { ...copy, ratingSummary, completedLessons, completedCourseId },
    ];

    res.status(200).json({
      status: 'success',
      data,
    });
  },
);

export const getMyLearningCourse = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!._id;
    const { completed } = req.query;

    if (!userId) {
      return next(new AppError('Authentication required', 401));
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
  },
);

export const searchMyLearningCourse = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    // logger.debug(courseArr);

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
  },
);

// Base CRUD operations from handlerFactory
export const createCourse = createOne(Course, {
  field: 'title',
  cachePattern: CacheEvent.COURSE.CREATED,
});
export const updateCourse = updateOne(Course, {
  cachePattern: CacheEvent.COURSE.UPDATED,
});
export const deleteCourse = deleteOne(Course, {
  cachePattern: CacheEvent.COURSE.DELETED,
});

// Multer configuration should be defined elsewhere
// export const setCoverImage = upload.single('imageCover');

export const resizePhoto = catchAsync(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.file) return next();

    const courseId = req.params.id;
    if (!courseId) {
      return next(
        new AppError('Course ID is required to upload a cover image.', 400),
      );
    }

    const result = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      publicId: `building-safety/courses/${courseId}`,
    });

    req.file.filename = result.secure_url;
    next();
  },
);

export const uploadResources = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  },
);

export const submitForReview = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { publishedStatus: 'review', submittedForReviewAt: new Date() },
      { new: true, runValidators: true },
    ).setOptions({ skipPublishedFilter: true });

    if (!course) {
      return next(new AppError('No course found with that ID', 404));
    }

    appEvents.emit(CacheEvent.COURSE.UPDATED, course);

    res.status(200).json({ status: 'success', data: course });
  },
);

export const publishCourse = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { publishedStatus: 'published', publishedAt: new Date() },
      { new: true, runValidators: true },
    ).setOptions({ skipPublishedFilter: true });

    if (!course) {
      return next(new AppError('No course found with that ID', 404));
    }

    appEvents.emit(CacheEvent.COURSE.UPDATED, course);

    // Notify the instructor that their course was published
    const instructorId = (course as any).instructors?.[0];
    if (instructorId) {
      const notification = await Notification.create({
        userId: instructorId,
        type: 'course_published',
        title: 'Course Published',
        message: `Your course "${(course as any).title}" has been published.`,
        link: `/courses/${(course as any).slug}`,
      });
      appEvents.emit('cache:notification:created', notification);
    }

    res.status(200).json({ status: 'success', data: course });
  },
);

export const archiveCourse = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { publishedStatus: 'archived' },
      { new: true, runValidators: true },
    ).setOptions({ skipPublishedFilter: true });

    if (!course) {
      return next(new AppError('No course found with that ID', 404));
    }

    appEvents.emit(CacheEvent.COURSE.UPDATED, course);

    res.status(200).json({ status: 'success', data: course });
  },
);
