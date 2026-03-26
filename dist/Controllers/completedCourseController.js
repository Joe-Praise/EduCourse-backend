"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCompletedCourse = exports.getOneCompletedCourse = exports.updateActiveCourseLessons = exports.getAllActiveCourse = exports.getAllCompletedCourse = exports.createCompletedCourse = exports.getRegisteredCourse = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const CompletedCourse = require('../models/completedcourseModel');
const filterObj = require('../utils/filterObj');
// Get courses user is registered to
exports.getRegisteredCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    const { userId } = req.params;
    const registeredCourses = await CompletedCourse.find({ userId });
    req.registeredCourses = registeredCourses;
    next();
});
exports.createCompletedCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    const exists = await CompletedCourse.find({
        userId: req.body.userId,
        courseId: req.body.courseId,
    });
    if (exists.length) {
        return next(new appError_1.default('Document already exists', 400));
    }
    const completedCourse = await CompletedCourse.create({
        userId: req.body.userId,
        courseId: req.body.courseId,
    });
    res.status(201).json({
        status: 'success',
        data: completedCourse,
    });
});
exports.getAllCompletedCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    // const { userId, courseId } = req.query;
    const { userId } = req.query;
    // req.query.completed = true;
    const features = new apiFeatures_1.default(CompletedCourse.find({ userId }), req.query)
        .filter()
        .sorting()
        .limitFields();
    const courses = await features.query;
    const paginate = new paginationFeatures_1.default(req.query).paginate(courses);
    res.status(200).json({
        status: 'success',
        metaData: paginate.metaData,
        data: paginate.data,
    });
});
exports.getAllActiveCourse = (0, catchAsync_1.default)(async (req, res, next) => {
    req.query.completed = false;
    // console.log(req.query);
    const features = new apiFeatures_1.default(CompletedCourse.find(), req.query)
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
exports.updateActiveCourseLessons = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const exists = await CompletedCourse.findById(id);
    // console.log(exists);
    if (!exists) {
        return next(new appError_1.default('Document does not exist', 400));
    }
    const filteredBody = filterObj(req.body, 'lessonsCompleted');
    const documentCopy = exists._doc;
    const data = { ...documentCopy };
    const findLessonArr = data.lessonsCompleted.find((lesson) => lesson.toString().includes(filteredBody.lessonsCompleted));
    if (!findLessonArr) {
        data.lessonsCompleted.push(filteredBody.lessonsCompleted);
        exists.overwrite({ ...data });
        await exists.save();
    }
    else {
        const updatedLessons = data.lessonsCompleted.filter((el) => !el.toString().includes(filteredBody.lessonsCompleted));
        data.lessonsCompleted = updatedLessons;
        exists.overwrite({ ...data });
        await exists.save();
    }
    res.status(200).json({
        status: 'success',
        result: exists.length,
        data: exists,
    });
});
exports.getOneCompletedCourse = (0, handlerFactory_1.getOne)(CompletedCourse);
exports.deleteCompletedCourse = (0, handlerFactory_1.deleteOne)(CompletedCourse);
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