"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLesson = exports.updateLesson = exports.getLesson = exports.getAllLessons = exports.createLesson = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Lesson = require('../models/lessonModel');
/**
 * Extract YouTube video ID from URL
 * @param url - YouTube URL passed to the request body
 * @returns YouTube VideoId to be saved in the backend
 */
const getVideoId = (url) => {
    const urlCopy = url.split('');
    const isFound = {};
    const urlIndex = urlCopy.reduce((acc, cur, index, arr) => {
        if (cur === '=' && isFound[cur] !== 1) {
            isFound[cur] = 1;
            acc.start = index + 1;
        }
        if (cur === '&' && isFound[cur] !== 1) {
            isFound[cur] = 1;
            acc.end = index;
        }
        if (!arr.includes('&')) {
            acc.end = arr.length;
        }
        return acc;
    }, { start: 0, end: 0 });
    const videoId = url.slice(urlIndex.start, urlIndex.end);
    return videoId;
};
exports.createLesson = (0, catchAsync_1.default)(async (req, res, next) => {
    // get all lessons for this module
    const exists = await Lesson.find({
        moduleId: req.body.moduleId,
    });
    // check if title exists in the arr
    const checkForExistingTitle = exists.find((el) => el.title === req.body.title);
    // throw error if it exists
    if (checkForExistingTitle) {
        return next(new appError_1.default('Document already exists', 404));
    }
    // Get the videoId Out
    // https://www.youtube.com/watch?v=UxiLC9XFvuM&t=14s
    req.body.url = getVideoId(req.body.url);
    // create index for ordering of modules
    const index = exists.length + 1;
    req.body.lessonIndex = index;
    const doc = await Lesson.create(req.body);
    res.status(201).json({
        status: 'success',
        data: doc,
    });
});
exports.getAllLessons = (0, catchAsync_1.default)(async (req, res, next) => {
    let lessons = [];
    const { moduleId, courseId } = req.query;
    if (courseId) {
        lessons = await Lesson.find({ courseId });
    }
    else if (moduleId) {
        lessons = await Lesson.find({ moduleId });
    }
    else {
        lessons = await Lesson.find();
    }
    lessons.forEach((el) => {
        el.active = undefined;
    });
    res.status(200).json({
        status: 'success',
        results: lessons.length,
        data: lessons,
    });
});
exports.getLesson = (0, handlerFactory_1.getOne)(Lesson);
exports.updateLesson = (0, handlerFactory_1.updateOne)(Lesson);
exports.deleteLesson = (0, handlerFactory_1.deleteOne)(Lesson);
//# sourceMappingURL=lessonController.js.map