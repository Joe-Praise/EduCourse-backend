"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResources = exports.resizePhoto = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.searchMyLearningCourse = exports.getMyLearningCourse = exports.getLectureCourse = exports.getCourse = exports.getAllCourses = exports.atlasAutocomplete = void 0;
const sharp_1 = __importDefault(require("sharp"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
const timeConverter_1 = require("../utils/timeConverter");
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Course = require('../models/courseModel');
const Review = require('../models/reviewModel');
const Module = require('../models/courseModuleModel');
const CompletedCourse = require('../models/completedcourseModel');
// Constants
const COURSE_AUTOCOMPLETE_INDEX_NAME = 'courseAutocomplete';
/**
 * Helper function to sum object values
 */
const addNumbers = (obj) => {
    return Object.values(obj).reduce((acc, value) => acc + value, 0);
};
/**
 * Calculate rating percentages from raw rating counts
 */
const calculatePercentage = (ratings) => {
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
const calculateRating = (array) => {
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
    const starsAverage = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    array.forEach(review => {
        const rating = Math.floor(review.rating);
        const key = rating.toString();
        if (key in starsAverage) {
            starsAverage[key] += 1;
        }
    });
    return calculatePercentage(starsAverage);
};
exports.atlasAutocomplete = (0, catchAsync_1.default)(async (req, res, next) => {
    const { q } = req.query;
    const pipeline = [];
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
exports.getAllCourses = (0, catchAsync_1.default)(async (req, res, next) => {
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
        const totalLessons = modules.flatMap((module) => module.lessons).length;
        const reviews = await Review.find({ courseId: doc[0]._id });
        const ratingSummary = calculateRating(reviews);
        // removing active from the fields returned
        doc[0].active = undefined;
        const copy = doc[0]._doc;
        copy.createdAt = (0, timeConverter_1.formatDate)(doc[0].createdAt);
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
    }
    else {
        // used to identify fields to run mongoose reference search on
        const referencedProperties = ['instructors', 'category'];
        const features = new apiFeatures_1.default(Course.find(), req.query)
            .filter(referencedProperties)
            .sorting()
            .limitFields();
        query = await features.query;
        const paginate = new paginationFeatures_1.default(req.query).paginate(query);
        let doc = paginate.data;
        doc = doc.map((el) => ({
            ...el._doc,
            createdAt: (0, timeConverter_1.formatDate)(el.createdAt),
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
exports.getCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const path = 'reviews';
    const doc = await Course.findById(id).populate(path);
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
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
exports.getLectureCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    const { userId, courseId } = req.params;
    const path = 'reviews';
    if (!userId && !courseId) {
        return next(new appError_1.default('Provide required params!', 404));
    }
    const exists = await CompletedCourse.find({
        userId,
        courseId,
    });
    if (!exists.length) {
        return next(new appError_1.default('Register for course to get access!', 400));
    }
    const doc = await Course.findById(courseId).populate(path);
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
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
exports.getMyLearningCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    const { userId } = req.params;
    const { completed } = req.query;
    if (!userId) {
        return next(new appError_1.default('Provide required params!', 404));
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
    }
    else if (completed === 'completed') {
        searchQuery = {
            userId,
            completed: true,
        };
    }
    else {
        searchQuery = { userId };
    }
    const exists = await CompletedCourse.find(searchQuery);
    // throw error if none is found
    if (!exists.length) {
        return next(new appError_1.default('No course found!', 400));
    }
    const courseArr = exists.flatMap((el) => el.courseId._id);
    req.query.completed = undefined;
    const features = new apiFeatures_1.default(Course.find({
        _id: { $in: courseArr },
    }), req.query)
        .filter()
        .sorting()
        .limitFields();
    const query = await features.query;
    const paginate = new paginationFeatures_1.default(req.query).paginate(query);
    let doc = paginate.data;
    doc = doc.map((el) => ({
        ...el._doc,
        createdAt: (0, timeConverter_1.formatDate)(el.createdAt),
    }));
    res.status(200).json({
        status: 'success',
        metaData: paginate.metaData,
        data: doc,
    });
});
exports.searchMyLearningCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    const { q } = req.query;
    const userId = req.user._id;
    if (!userId) {
        return next(new appError_1.default('Provide required params!', 404));
    }
    // get all courses user has applied for
    const exists = await CompletedCourse.find({
        userId,
    });
    // throw error if none is found
    if (!exists.length) {
        return next(new appError_1.default('Could not find any course!.', 400));
    }
    const courseArr = exists.flatMap((el) => el.courseId._id);
    // console.log(courseArr);
    const doc = await Course.find({ $and: [{ _id: { $in: courseArr } }, { $text: { $search: q } }] }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .lean();
    let data = doc.map((el) => ({
        ...el,
        createdAt: (0, timeConverter_1.formatDate)(el.createdAt),
    }));
    doc.active = undefined;
    res.status(200).json({
        status: 'success',
        data,
    });
});
exports.createCourse = (0, handlerFactory_1.createOne)(Course, { field: 'title' });
exports.updateCourse = (0, handlerFactory_1.updateOne)(Course);
exports.deleteCourse = (0, handlerFactory_1.deleteOne)(Course);
// Multer configuration should be defined elsewhere
// export const setCoverImage = upload.single('imageCover');
exports.resizePhoto = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file)
        return next();
    req.file.filename = `course-${req.user.id}-${Date.now()}.jpeg`;
    await (0, sharp_1.default)(req.file.buffer)
        .resize(800, 800)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/course/${req.file.filename}`);
    next();
});
exports.uploadResources = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file) {
        return next(new appError_1.default('This route is for only resources.', 400));
    }
    req.body.imageCover = req.file.filename;
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedCourse,
        },
    });
});
//# sourceMappingURL=courseController.js.map