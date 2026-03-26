"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const instructorController_js_1 = require("../Controllers/instructorController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const completedCourseController_js_1 = require("../Controllers/completedCourseController.js");
const router = express_1.default.Router();
router
    .route('/')
    .get(instructorController_js_1.getAllInstructors)
    .post(authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin', 'instructor']), instructorController_js_1.createInstructor);
router.patch('/updateMe', authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin', 'instructor']), instructorController_js_1.updateMe);
router.delete('/deleteMe', authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin', 'instructor']), instructorController_js_1.deleteMe);
router.delete('/:id/suspendInstructor', authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin']), instructorController_js_1.suspendInstructor);
router.get('/myLearningInstructors/:userId', authMiddleware_js_1.protect, completedCourseController_js_1.getRegisteredCourse, instructorController_js_1.getMyLearningInstructors);
router
    .route('/:id')
    .get(instructorController_js_1.getOneInstructor)
    .patch(authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin', 'instructor']), instructorController_js_1.updateInstructor)
    .delete(authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin', 'instructor']), instructorController_js_1.deleteInstructor);
exports.default = router;
//# sourceMappingURL=instructorRoutes.js.map