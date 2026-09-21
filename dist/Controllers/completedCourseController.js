import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { getOne, deleteOne } from './handlerFactory.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { appEvents } from '../events/index.js';
// Import CommonJS modules
import { CompletedCourse } from "../models/completedcourseModel.js";
import { Lesson } from "../models/lessonModel.js";
import filterObj from "../utils/filterObj.js";
// Import cache events to register listeners
import '../events/cache/completedCourseCache.events.js';
// Get courses user is registered to
export const getRegisteredCourse = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const registeredCourses = await CompletedCourse.find({ userId });
    req.registeredCourses = registeredCourses;
    next();
});
export const createCompletedCourse = catchAsync(async (req, res, next) => {
    const exists = await CompletedCourse.find({
        userId: req.body.userId,
        courseId: req.body.courseId,
    });
    if (exists.length) {
        return next(new AppError('Document already exists', 400));
    }
    const completedCourse = await CompletedCourse.create({
        userId: req.body.userId,
        courseId: req.body.courseId,
    });
    appEvents.emit(CacheEvent.COMPLETED_COURSE.CREATED, completedCourse);
    res.status(201).json({
        status: 'success',
        data: completedCourse,
    });
});
export const getAllCompletedCourse = catchAsync(async (req, res, next) => {
    // const { userId, courseId } = req.query;
    const { userId } = req.query;
    // req.query.completed = true;
    const features = new APIFeatures(CompletedCourse.find({ userId }), req.query)
        .filter()
        .sorting()
        .limitFields();
    const courses = await features.query;
    const paginate = new Pagination(req.query).paginate(courses);
    res.status(200).json({
        status: 'success',
        metaData: paginate.metaData,
        data: paginate.data,
    });
});
export const getAllActiveCourse = catchAsync(async (req, res, next) => {
    req.query.completed = false;
    // logger.debug(req.query);
    const features = new APIFeatures(CompletedCourse.find(), req.query)
        .filter()
        .sorting()
        .limitFields();
    const courses = await features.query;
    res.status(200).json({
        status: 'success',
        result: courses.length,
        data: courses,
    });
});
export const updateActiveCourseLessons = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const exists = await CompletedCourse.findById(id);
    // logger.debug(exists);
    if (!exists) {
        return next(new AppError('Document does not exist', 400));
    }
    const filteredBody = filterObj(req.body, 'lessonsCompleted');
    // Get the document data safely
    const data = exists.toObject();
    const findLessonArr = data.lessonsCompleted.find((lesson) => lesson.toString().includes(filteredBody.lessonsCompleted));
    if (!findLessonArr) {
        // Add the lesson if not found
        exists.lessonsCompleted.push(filteredBody.lessonsCompleted);
        await exists.save();
    }
    else {
        // Remove the lesson if found (toggle behavior)
        exists.lessonsCompleted = exists.lessonsCompleted.filter((el) => !el.toString().includes(filteredBody.lessonsCompleted));
        await exists.save();
    }
    res.status(200).json({
        status: 'success',
        data: exists,
    });
});
export const getProgressSummary = catchAsync(async (req, res, next) => {
    const { userId, courseId } = req.params;
    const record = await CompletedCourse.findOne({ userId, courseId }).setOptions({ skipPopulate: true });
    if (!record) {
        return res.status(200).json({
            status: 'success',
            data: { lessonsCompleted: 0, totalLessons: 0, completionPercentage: 0, completed: false },
        });
    }
    const totalLessons = await Lesson.countDocuments({ courseId });
    const lessonsCompleted = record.lessonsCompleted.length;
    const completionPercentage = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;
    res.status(200).json({
        status: 'success',
        data: { lessonsCompleted, totalLessons, completionPercentage, completed: record.completed },
    });
});
export const getOneCompletedCourse = getOne(CompletedCourse);
export const deleteCompletedCourse = deleteOne(CompletedCourse, { cachePattern: CacheEvent.COMPLETED_COURSE.DELETED });
// catchAsync(async (req, res, next) => {
//     const { id } = req.params;
//     const course = await CompletedCourse.findOne({ _id: id });
//     const data = course._doc;
//     course.overwrite({ ...data, ...req.body });
//     course.save();
//     res.status(200).json({
//       status: 'success',
//       data: course,
//     });
//   });
//# sourceMappingURL=completedCourseController.js.map