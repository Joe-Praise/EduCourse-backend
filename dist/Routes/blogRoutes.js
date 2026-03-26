"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const blogController_js_1 = require("../Controllers/blogController.js");
const blogCommentRoutes_js_1 = __importDefault(require("./blogCommentRoutes.js"));
const router = express_1.default.Router();
router.use('/:blogId/comments', blogCommentRoutes_js_1.default);
router.route('/autocomplete').get(blogController_js_1.atlasAutocomplete);
router
    .route('/')
    .get(blogController_js_1.getAllBlog)
    .post(authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['instructor', 'admin']), blogController_js_1.createBlog);
router.use(authMiddleware_js_1.protect);
router
    .route('/:id/resources')
    .patch((0, authMiddleware_js_1.restrictTo)(['admin', 'instructor']), blogController_js_1.setCoverImage, blogController_js_1.resizePhoto, blogController_js_1.uploadResources);
router
    .route('/:id')
    .get(blogController_js_1.getBlog)
    .patch((0, authMiddleware_js_1.restrictTo)(['instructor', 'admin']), blogController_js_1.updateBlog)
    .delete((0, authMiddleware_js_1.restrictTo)(['instructor', 'admin']), blogController_js_1.deleteBlog);
exports.default = router;
//# sourceMappingURL=blogRoutes.js.map