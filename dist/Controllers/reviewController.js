"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.getReview = exports.updateReview = exports.getAllReview = exports.createReview = exports.setCourseUserIds = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const timeConverter_1 = require("../utils/timeConverter");
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Review = require('../models/reviewModel');
exports.setCourseUserIds = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.body.userId)
        req.body.userId = req.user._id;
    if (!req.body.courseId)
        req.body.courseId = req.params.courseId;
    next();
});
exports.createReview = (0, handlerFactory_1.createOne)(Review);
exports.getAllReview = (0, catchAsync_1.default)(async (req, res, next) => {
    let filter = {};
    if (req.params.courseId)
        filter = { courseId: req.params.courseId };
    const referencedProperties = ['userId', 'courseId'];
    const features = new apiFeatures_1.default(Review.find(filter), req.query)
        .filter(referencedProperties)
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
exports.updateReview = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { courseId } = req.body;
    const review = await Review.findById({ _id: id });
    const doc = review._doc;
    review.overwrite({ ...doc, courseId });
    await review.save({ validateBeforeSave: false });
    res.status(200).json({
        status: 'success',
        data: doc,
    });
});
exports.getReview = (0, handlerFactory_1.getOne)(Review);
exports.deleteReview = (0, handlerFactory_1.deleteOne)(Review);
//# sourceMappingURL=reviewController.js.map