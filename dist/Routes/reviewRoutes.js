"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const reviewController_js_1 = require("../Controllers/reviewController.js");
const router = express_1.default.Router({ mergeParams: true });
router
    .route('/')
    .get(reviewController_js_1.getAllReview)
    .post(authMiddleware_js_1.protect, (0, authMiddleware_js_1.requirePermission)('reviews', 'create'), reviewController_js_1.setCourseUserIds, reviewController_js_1.createReview);
router.use(authMiddleware_js_1.protect);
router
    .route('/:id')
    .get(reviewController_js_1.getReview)
    .patch((0, authMiddleware_js_1.requirePermission)('reviews', 'update'), reviewController_js_1.updateReview)
    .delete((0, authMiddleware_js_1.requirePermission)('reviews', 'delete'), reviewController_js_1.deleteReview);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map