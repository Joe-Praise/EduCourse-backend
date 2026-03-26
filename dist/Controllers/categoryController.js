"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.getMyLearningCategory = exports.getAllCategory = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Category = require('../models/categoryModel');
exports.getAllCategory = (0, handlerFactory_1.getAll)(Category);
exports.getMyLearningCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    // used middleware in completedCourse controller to get this data
    const { registeredCourses } = req;
    if (!registeredCourses) {
        return res.status(200).json({
            status: 'success',
            data: [],
        });
    }
    const getCategoryId = registeredCourses.map((course) => course.courseId.category._id);
    const category = await Category.find({ _id: { $in: getCategoryId } });
    res.status(200).json({
        status: 'success',
        data: category,
    });
});
exports.getCategory = (0, handlerFactory_1.getOne)(Category);
exports.createCategory = (0, handlerFactory_1.createOne)(Category);
exports.updateCategory = (0, handlerFactory_1.updateOne)(Category);
exports.deleteCategory = (0, handlerFactory_1.deleteOne)(Category);
//# sourceMappingURL=categoryController.js.map