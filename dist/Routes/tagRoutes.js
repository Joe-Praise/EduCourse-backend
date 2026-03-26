"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tagController_js_1 = require("../Controllers/tagController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const router = express_1.default.Router();
router.route('/').get(tagController_js_1.getAllTags).post(authMiddleware_js_1.protect, (0, authMiddleware_js_1.restrictTo)(['admin']), tagController_js_1.createTag);
router.use(authMiddleware_js_1.protect);
router
    .route('/:id')
    .get(tagController_js_1.getTag)
    .patch((0, authMiddleware_js_1.restrictTo)(['admin']), tagController_js_1.updateTag)
    .delete((0, authMiddleware_js_1.restrictTo)(['admin']), tagController_js_1.deleteTag);
exports.default = router;
//# sourceMappingURL=tagRoutes.js.map