"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.landingPage = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const timeConverter_1 = require("../utils/timeConverter");
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
// Import CommonJS modules
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Instructor = require('../models/instructorModel');
const Blog = require('../models/blogModel');
const FetchLandingPageData = async (query, limit) => {
    const queryString = { limit, page: 1 };
    const documents = await query.find().limit(limit).sort('-createdAt');
    const paginate = new paginationFeatures_1.default(queryString).paginate(documents);
    let doc = paginate.data;
    doc = doc.map((el) => ({
        ...el._doc,
        createdAt: (0, timeConverter_1.formatDate)(el.createdAt),
    }));
    return doc;
};
exports.landingPage = (0, catchAsync_1.default)(async (req, res, next) => {
    const limit = 6;
    const instructorLimit = 4;
    const courses = await FetchLandingPageData(Course, limit);
    const blogs = await FetchLandingPageData(Blog, limit);
    const instructors = await FetchLandingPageData(Instructor, instructorLimit);
    const categories = await Category.find().limit(limit);
    res.status(200).json({
        status: 'success',
        data: {
            courses,
            blogs,
            instructors,
            categories,
        },
    });
});
//# sourceMappingURL=landingPageController.js.map