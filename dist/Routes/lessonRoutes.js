"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const lessonController_js_1 = require("../Controllers/lessonController.js");
const router = express_1.default.Router();
router.use(authMiddleware_js_1.protect);
router
    .route('/')
    .get(lessonController_js_1.getAllLessons)
    .post((0, authMiddleware_js_1.requirePermission)('lessons', 'create'), lessonController_js_1.createLesson);
router
    .route('/:id')
    .get(lessonController_js_1.getLesson)
    .patch((0, authMiddleware_js_1.requirePermission)('lessons', 'update'), lessonController_js_1.updateLesson)
    .delete((0, authMiddleware_js_1.requirePermission)('lessons', 'delete'), lessonController_js_1.deleteLesson);
exports.default = router;
//# sourceMappingURL=lessonRoutes.js.map