"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const completedCourseController_js_1 = require("../Controllers/completedCourseController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const router = express_1.default.Router();
router.use(authMiddleware_js_1.protect);
router.route('/').get(completedCourseController_js_1.getAllCompletedCourse).post(completedCourseController_js_1.createCompletedCourse);
router
    .route('/:id')
    .get(completedCourseController_js_1.getOneCompletedCourse)
    .patch(completedCourseController_js_1.updateActiveCourseLessons)
    .delete(completedCourseController_js_1.deleteCompletedCourse);
router.route('/active/course').get(completedCourseController_js_1.getAllActiveCourse);
exports.default = router;
//# sourceMappingURL=completedCoureseRoutes.js.map