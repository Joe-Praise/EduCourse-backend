"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const linkController_js_1 = require("../Controllers/linkController.js");
const router = express_1.default.Router();
router.route('/').get(linkController_js_1.getAllLinks).post(linkController_js_1.createLink);
router
    .route('/id')
    .get(linkController_js_1.getLink)
    .patch(authMiddleware_js_1.protect, linkController_js_1.updateLink)
    .delete(authMiddleware_js_1.protect, linkController_js_1.deleteLink);
exports.default = router;
//# sourceMappingURL=linkRoutes.js.map