"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const blogCommentController_js_1 = require("../Controllers/blogCommentController.js");
const router = express_1.default.Router({ mergeParams: true });
router
    .route('/')
    .get(blogCommentController_js_1.getAllBlogComments)
    .post(authMiddleware_js_1.protect, (0, authMiddleware_js_1.requirePermission)('reviews', 'create'), blogCommentController_js_1.setBlogId, blogCommentController_js_1.createBlogComment);
router.use(authMiddleware_js_1.protect);
router
    .route('/:id')
    .get(blogCommentController_js_1.getBlogComment)
    .patch((0, authMiddleware_js_1.requirePermission)('reviews', 'update'), blogCommentController_js_1.updateBlogComment)
    .delete((0, authMiddleware_js_1.requirePermission)('reviews', 'delete'), blogCommentController_js_1.deleteBlogComment);
exports.default = router;
//# sourceMappingURL=blogCommentRoutes.js.map