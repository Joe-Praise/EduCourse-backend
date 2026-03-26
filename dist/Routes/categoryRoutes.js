"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_js_1 = require("../Controllers/categoryController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const completedCourseController_js_1 = require("../Controllers/completedCourseController.js");
const router = express_1.default.Router();
router.route('/').get(categoryController_js_1.getAllCategory).post(authMiddleware_js_1.protect, categoryController_js_1.createCategory);
router.use(authMiddleware_js_1.protect);
router.get('/registered/:userId', completedCourseController_js_1.getRegisteredCourse, categoryController_js_1.getMyLearningCategory);
router
    .route('/:id')
    .get(categoryController_js_1.getCategory)
    .patch(categoryController_js_1.updateCategory)
    .delete((0, authMiddleware_js_1.restrictTo)(['admin']), categoryController_js_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map