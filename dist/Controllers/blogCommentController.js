import APIFeatures from '../utils/apiFeatures.js';
import catchAsync from '../utils/catchAsync.js';
import Pagination from '../utils/paginationFeatures.js';
import { createOne, getOne, updateOne, deleteOne } from './handlerFactory.js';
import { formatDate } from '../utils/timeConverter.js';
import { BlogComment } from '../models/blogCommentModel.js';
import { CacheEvent } from '../events/cache/cache.events.js';
// Import cache events to register listeners
import '../events/cache/blogCommentCache.events.js';
/**
 * Middleware to set blog and user IDs for nested routes
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export const setBlogId = (req, res, next) => {
    // Allow nested routes
    if (!req.body.blogId)
        req.body.blogId = req.params.blogId;
    if (!req.body.userId)
        req.body.userId = req.user?._id;
    next();
};
/**
 * Get all blog comments with filtering and pagination
 * Supports nested routes and date formatting
 */
export const getAllBlogComments = catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.blogId)
        filter = { blogId: req.params.blogId };
    const features = new APIFeatures(BlogComment.find(filter), req.query)
        .filter()
        .sorting()
        .limitFields();
    const query = await features.query;
    const pagination = new Pagination(req.query);
    const paginatedResult = pagination.paginate(query);
    let doc = paginatedResult.data;
    // Format creation dates to match dayjs format 'MMMM D, YYYY'
    doc = doc.map((el) => ({
        ...el._doc,
        createdAt: formatDate(el.createdAt, { format: 'medium' }),
    }));
    res.status(200).json({
        status: 'success',
        metaData: paginatedResult.metaData,
        data: doc,
    });
});
// CRUD operations using factory functions
export const createBlogComment = createOne(BlogComment, { cachePattern: CacheEvent.BLOG_COMMENT.CREATED });
export const getBlogComment = getOne(BlogComment, { modelName: 'blogcomment' });
export const updateBlogComment = updateOne(BlogComment, { cachePattern: CacheEvent.BLOG_COMMENT.UPDATED });
export const deleteBlogComment = deleteOne(BlogComment, { cachePattern: CacheEvent.BLOG_COMMENT.DELETED });
//# sourceMappingURL=blogCommentController.js.map