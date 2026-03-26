"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogComment = exports.updateBlogComment = exports.getBlogComment = exports.createBlogComment = exports.getAllBlogComments = exports.setBlogId = void 0;
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
const handlerFactory_1 = require("./handlerFactory");
const timeConverter_1 = require("../utils/timeConverter");
const blogCommentModel_js_1 = require("../models/blogCommentModel.js");
/**
 * Middleware to set blog and user IDs for nested routes
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
const setBlogId = (req, res, next) => {
    // Allow nested routes
    if (!req.body.blogId)
        req.body.blogId = req.params.blogId;
    if (!req.body.userId)
        req.body.userId = req.user?._id;
    next();
};
exports.setBlogId = setBlogId;
/**
 * Get all blog comments with filtering and pagination
 * Supports nested routes and date formatting
 */
exports.getAllBlogComments = (0, catchAsync_1.default)(async (req, res) => {
    let filter = {};
    if (req.params.blogId)
        filter = { blogId: req.params.blogId };
    const features = new apiFeatures_1.default(blogCommentModel_js_1.BlogComment.find(filter), req.query)
        .filter()
        .sorting()
        .limitFields();
    const query = await features.query;
    const pagination = new paginationFeatures_1.default(req.query);
    const paginatedResult = pagination.paginate(query);
    let doc = paginatedResult.data;
    // Format creation dates to match dayjs format 'MMMM D, YYYY'
    doc = doc.map((el) => ({
        ...el._doc,
        createdAt: (0, timeConverter_1.formatDate)(el.createdAt, { format: 'medium' }),
    }));
    res.status(200).json({
        status: 'success',
        metaData: paginatedResult.metaData,
        data: doc,
    });
});
// CRUD operations using factory functions
exports.createBlogComment = (0, handlerFactory_1.createOne)(blogCommentModel_js_1.BlogComment);
exports.getBlogComment = (0, handlerFactory_1.getOne)(blogCommentModel_js_1.BlogComment);
exports.updateBlogComment = (0, handlerFactory_1.updateOne)(blogCommentModel_js_1.BlogComment);
exports.deleteBlogComment = (0, handlerFactory_1.deleteOne)(blogCommentModel_js_1.BlogComment);
//# sourceMappingURL=blogCommentController.js.map