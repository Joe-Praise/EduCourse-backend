"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResources = exports.resizePhoto = exports.getAllBlog = exports.atlasAutocomplete = exports.setCoverImage = exports.deleteBlog = exports.updateBlog = exports.getBlog = exports.createBlog = void 0;
const sharp_1 = __importDefault(require("sharp"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
const timeConverter_1 = require("../utils/timeConverter");
const handlerFactory_1 = require("./handlerFactory");
const blogModel_js_1 = require("../models/blogModel.js");
const handleImageUpload_js_1 = __importDefault(require("../utils/handleImageUpload.js"));
// Constants
const BLOG_AUTOCOMPLETE_INDEX_NAME = 'blogAutocomplete';
const BLOG_IMAGE_DIMENSIONS = { width: 700, height: 700 };
const AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
const AUTOCOMPLETE_LIMIT = 10;
/**
 * CRUD operations using factory functions
 */
exports.createBlog = (0, handlerFactory_1.createOne)(blogModel_js_1.Blog, { field: 'title' });
exports.getBlog = (0, handlerFactory_1.getOne)(blogModel_js_1.Blog, { path: 'comments' });
exports.updateBlog = (0, handlerFactory_1.updateOne)(blogModel_js_1.Blog);
exports.deleteBlog = (0, handlerFactory_1.deleteOne)(blogModel_js_1.Blog);
/**
 * Configure multer for single image upload
 */
exports.setCoverImage = handleImageUpload_js_1.default.single('imageCover');
/**
 * Atlas search autocomplete for blog titles
 * Provides real-time search suggestions with fuzzy matching
 */
exports.atlasAutocomplete = (0, catchAsync_1.default)(async (req, res, next) => {
    const { query } = req.query;
    // Validate query length for performance
    if (!query || query.length < AUTOCOMPLETE_MIN_QUERY_LENGTH) {
        return res.status(200).json({
            status: 'success',
            data: [],
            message: 'Query too short for autocomplete'
        });
    }
    const pipeline = [
        {
            $search: {
                index: BLOG_AUTOCOMPLETE_INDEX_NAME,
                autocomplete: {
                    query,
                    path: 'title',
                    tokenOrder: 'sequential',
                    fuzzy: {
                        maxEdits: 1,
                        prefixLength: 2
                    },
                },
            },
        },
        {
            $project: {
                score: { $meta: 'searchScore' },
                title: 1,
                slug: 1,
                _id: 1,
            },
        },
        {
            $limit: AUTOCOMPLETE_LIMIT
        }
    ];
    try {
        const result = await blogModel_js_1.Blog.aggregate(pipeline);
        res.status(200).json({
            status: 'success',
            data: result,
            count: result.length
        });
    }
    catch (error) {
        return next(new appError_1.default('Autocomplete search failed', 500));
    }
});
/**
 * Get all blogs with advanced filtering, pagination, and date formatting
 * Supports both slug-based individual queries and list queries
 */
exports.getAllBlog = (0, catchAsync_1.default)(async (req, res, next) => {
    const { slug } = req.query;
    // Handle single blog by slug
    if (slug) {
        const doc = await blogModel_js_1.Blog.find({ slug }).lean();
        if (!doc.length) {
            return next(new appError_1.default('No blog found with that slug', 404));
        }
        // Format the single blog document
        const formattedBlog = {
            ...doc[0],
            createdAt: (0, timeConverter_1.formatDate)(doc[0].createdAt, { format: 'medium' }),
            active: undefined // Remove internal field
        };
        res.status(200).json({
            status: 'success',
            data: [formattedBlog],
        });
        return;
    }
    // Handle multiple blogs with filtering and pagination
    const referencedProperties = ['category', 'tag'];
    const features = new apiFeatures_1.default(blogModel_js_1.Blog.find(), req.query)
        .filter(referencedProperties)
        .sorting()
        .limitFields();
    const documents = await features.query;
    // Apply pagination
    const pagination = new paginationFeatures_1.default(req.query);
    const paginatedResult = pagination.paginate(documents);
    // Format dates and remove internal fields
    const formattedBlogs = paginatedResult.data.map((blog) => ({
        ...blog._doc,
        createdAt: (0, timeConverter_1.formatDate)(blog.createdAt, { format: 'medium' }),
        active: undefined // Remove internal field
    }));
    res.status(200).json({
        status: 'success',
        metaData: paginatedResult.metaData,
        data: formattedBlogs,
    });
});
/**
 * Resize and optimize blog cover images
 * Uses sharp for efficient image processing
 */
exports.resizePhoto = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file)
        return next();
    // Generate unique filename
    const timestamp = Date.now();
    const userId = req.user?.id || 'anonymous';
    req.file.filename = `blog-${userId}-${timestamp}.jpeg`;
    try {
        await (0, sharp_1.default)(req.file.buffer)
            .resize(BLOG_IMAGE_DIMENSIONS.width, BLOG_IMAGE_DIMENSIONS.height, {
            fit: 'cover',
            position: 'center'
        })
            .toFormat('jpeg')
            .jpeg({
            quality: 90,
            progressive: true
        })
            .toFile(`public/blog/${req.file.filename}`);
        next();
    }
    catch (error) {
        return next(new appError_1.default('Image processing failed', 500));
    }
});
/**
 * Upload and associate blog resources/images
 * Updates blog document with new image filename
 */
exports.uploadResources = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file?.filename) {
        return next(new appError_1.default('This route is for resource uploads only', 400));
    }
    // Add image filename to request body
    req.body.imageCover = req.file.filename;
    try {
        const updatedBlog = await blogModel_js_1.Blog.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedBlog) {
            return next(new appError_1.default('No blog found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                blog: updatedBlog,
            },
        });
    }
    catch (error) {
        return next(new appError_1.default('Failed to update blog with new image', 500));
    }
});
//# sourceMappingURL=blogController.js.map