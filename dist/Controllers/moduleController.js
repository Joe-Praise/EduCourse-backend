"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteModule = exports.updateModule = exports.getModule = exports.getAllModules = exports.createModule = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Module = require('../models/courseModuleModel');
// const CompletedCourse = require('../models/completedcourseModel');
exports.createModule = (0, catchAsync_1.default)(async (req, res, next) => {
    // query for all modules linked to the passed course
    const modules = await Module.find({
        courseId: req.body.courseId,
    });
    const findMatch = modules.find((item) => item.title === req.body.title);
    if (findMatch) {
        return next(new appError_1.default('Module with that title already exists!', 404));
    }
    //   create index for ordering of modules
    const index = modules.length + 1;
    req.body.moduleIndex = index;
    req.body.section = `Section ${index}`;
    // console.log(req.body);
    // create the module if all cases are passed
    const module = await Module.create({
        courseId: req.body.courseId,
        title: req.body.title,
        moduleIndex: req.body.moduleIndex,
        section: req.body.section,
    });
    res.status(201).json({
        status: 'success',
        data: module,
    });
});
exports.getAllModules = (0, catchAsync_1.default)(async (req, res, next) => {
    let modules = [];
    const { courseId } = req.query;
    if (courseId) {
        modules = await Module.find({ courseId });
    }
    else {
        modules = await Module.find();
    }
    res.status(200).json({
        status: 'success',
        results: modules.length,
        data: modules,
    });
});
// exports.getLectureModules = catchAsync(async (req, res, next) => {
//   // let modules = [];
//   const { courseId } = req.query;
//   console.log(req.user._id);
//   const isActivated = await CompletedCourse.find({
//     courseId,
//     userId: req.user._id,
//   });
//   console.log(isActivated);
//   // if (isActivated) {
//   //   modules = await Module.find({ courseId });
//   // } else {
//   //   return next(new AppError('Module with that title already exists!', 404));
//   // }
//   // res.status(201).json({
//   //   status: 'success',
//   //   results: modules.length,
//   //   data: modules,
//   // });
// });
exports.getModule = (0, handlerFactory_1.getOne)(Module);
exports.updateModule = (0, handlerFactory_1.updateOne)(Module);
exports.deleteModule = (0, handlerFactory_1.deleteOne)(Module);
//# sourceMappingURL=moduleController.js.map