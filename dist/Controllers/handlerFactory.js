"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.bulkUpdate = exports.searchModel = exports.getAll = exports.getOne = exports.createOne = exports.updateOne = exports.deleteOne = void 0;
const apiFeatures_1 = __importDefault(require("../utils/apiFeatures"));
const appError_1 = __importDefault(require("../utils/appError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const paginationFeatures_1 = __importDefault(require("../utils/paginationFeatures"));
/**
 * Soft delete handler
 * Marks document as inactive instead of physical deletion for audit trails
 * @param Model - Mongoose model to operate on
 */
const deleteOne = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
    }
    const response = {
        status: 'success',
        data: null,
    };
    res.status(204).json(response);
});
exports.deleteOne = deleteOne;
/**
 * Update handler with validation
 * @param Model - Mongoose model to operate on
 */
const updateOne = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
    }
    const response = {
        status: 'success',
        data: doc,
    };
    res.status(200).json(response);
});
exports.updateOne = updateOne;
/**
 * Create handler with duplicate checking
 * @param Model - Mongoose model to operate on
 * @param popOptions - Options for duplicate checking and population
 */
const createOne = (Model, popOptions) => (0, catchAsync_1.default)(async (req, res, next) => {
    // duplicate checking
    if (popOptions?.field) {
        const checkField = popOptions.field;
        const fieldValue = req.body[checkField];
        if (fieldValue) {
            const filter = {};
            filter[checkField] = fieldValue;
            const existingDoc = await Model.findOne(filter);
            if (existingDoc) {
                return next(new appError_1.default(`Document with ${checkField} '${fieldValue}' already exists`, 409));
            }
        }
    }
    const doc = await Model.create(req.body);
    const response = {
        status: 'success',
        data: doc,
    };
    res.status(201).json(response);
});
exports.createOne = createOne;
/**
 * Get single document handler with population
 * @param Model - Mongoose model to operate on
 * @param popOptions - Population options for related documents
 */
const getOne = (Model, popOptions) => (0, catchAsync_1.default)(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
        query = query.populate(popOptions);
    }
    const doc = await query;
    if (!doc) {
        return next(new appError_1.default('No document found with that ID', 404));
    }
    // Remove internal fields from response
    const sanitizedDoc = { ...doc.toObject() };
    delete sanitizedDoc.active;
    const response = {
        status: 'success',
        data: sanitizedDoc,
    };
    res.status(200).json(response);
});
exports.getOne = getOne;
/**
 * Get all documents handler with advanced filtering and pagination
 * @param Model - Mongoose model to operate on
 */
const getAll = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    const { slug } = req.query;
    // Handle slug-based queries (for SEO-friendly URLs)
    if (slug) {
        const docs = await Model.find({ slug });
        const response = {
            status: 'success',
            data: docs,
        };
        return res.status(200).json(response);
    }
    // filtering with APIFeatures
    const features = new apiFeatures_1.default(Model.find(), req.query)
        .filter()
        .sorting()
        .limitFields();
    const documents = await features.query;
    // pagination
    const pagination = new paginationFeatures_1.default(req.query);
    const paginatedResult = pagination.paginate(documents);
    const response = {
        status: 'success',
        metaData: paginatedResult.metaData,
        data: paginatedResult.data,
    };
    res.status(200).json(response);
});
exports.getAll = getAll;
/**
 *  Text search handler with scoring
 * @param Model - Mongoose model to operate on (must have text index)
 */
const searchModel = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    const { search } = req.query;
    if (!search) {
        return next(new appError_1.default('Search query is required', 400));
    }
    // text search with relevance scoring
    const docs = await Model.find({ $text: { $search: search } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .lean();
    // Sanitize documents (remove internal fields)
    const sanitizedDocs = docs.map(doc => {
        const { active, ...sanitized } = doc;
        return sanitized;
    });
    const response = {
        status: 'success',
        data: sanitizedDocs,
    };
    res.status(200).json(response);
});
exports.searchModel = searchModel;
/**
 * Bulk operations handler
 * @param Model - Mongoose model to operate on
 */
const bulkUpdate = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    const { ids, updateData } = req.body;
    if (!ids || !Array.isArray(ids) || !updateData) {
        return next(new appError_1.default('Valid ids array and updateData are required', 400));
    }
    const result = await Model.updateMany({ _id: { $in: ids } }, updateData, { runValidators: true });
    const response = {
        status: 'success',
        data: {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        },
    };
    res.status(200).json(response);
});
exports.bulkUpdate = bulkUpdate;
/**
 * Analytics handler for document statistics
 * @param Model - Mongoose model to operate on
 */
const getAnalytics = (Model) => (0, catchAsync_1.default)(async (req, res, next) => {
    const analytics = await Model.aggregate([
        {
            $group: {
                _id: null,
                totalDocuments: { $sum: 1 },
                activeDocuments: {
                    $sum: { $cond: [{ $ne: ['$active', false] }, 1, 0] }
                },
                inactiveDocuments: {
                    $sum: { $cond: [{ $eq: ['$active', false] }, 1, 0] }
                },
            }
        }
    ]);
    const response = {
        status: 'success',
        data: analytics[0] || {
            totalDocuments: 0,
            activeDocuments: 0,
            inactiveDocuments: 0,
        },
    };
    res.status(200).json(response);
});
exports.getAnalytics = getAnalytics;
//# sourceMappingURL=handlerFactory.js.map