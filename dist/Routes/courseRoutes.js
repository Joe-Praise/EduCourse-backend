"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseController_js_1 = require("../Controllers/courseController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const reviewRoutes_js_1 = __importDefault(require("./reviewRoutes.js"));
const handleImageUpload_js_1 = __importDefault(require("../utils/handleImageUpload.js"));
const router = express_1.default.Router();
router.use('/:courseId/reviews', reviewRoutes_js_1.default);
router
    .route('/')
    .get(courseController_js_1.getAllCourses)
    .post(authMiddleware_js_1.protect, (0, authMiddleware_js_1.requirePermission)('courses', 'create'), courseController_js_1.createCourse);
// router.route('/search').get(atlasSearchCourse);
router.route('/autocomplete').get(courseController_js_1.atlasAutocomplete);
router.use(authMiddleware_js_1.protect);
router.route('/learn/:userId/:courseId').get(courseController_js_1.getLectureCourse);
router.route('/mylearning/:userId').get(courseController_js_1.getMyLearningCourse);
router
    .route('/:id/resources')
    .patch((0, authMiddleware_js_1.requirePermission)('courses', 'update'), handleImageUpload_js_1.default.single('imageCover'), courseController_js_1.resizePhoto, courseController_js_1.uploadResources);
router
    .route('/:id')
    .get(courseController_js_1.getCourse)
    .patch((0, authMiddleware_js_1.requirePermission)('courses', 'update'), courseController_js_1.updateCourse)
    .delete((0, authMiddleware_js_1.requirePermission)('courses', 'delete'), courseController_js_1.deleteCourse);
exports.default = router;
//# sourceMappingURL=courseRoutes.js.map