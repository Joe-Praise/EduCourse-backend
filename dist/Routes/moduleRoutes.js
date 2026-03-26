"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const moduleController_js_1 = require("../Controllers/moduleController.js");
const router = express_1.default.Router();
router.route('/').get(moduleController_js_1.getAllModules);
router.use(authMiddleware_js_1.protect);
// router.route('/lecture').get(getAllLectureModules);
// router.route('/lecture').get(getLectureModules);
router.route('/').post((0, authMiddleware_js_1.requirePermission)('lessons', 'create'), moduleController_js_1.createModule);
router
    .route('/:id')
    .get(moduleController_js_1.getModule)
    .patch((0, authMiddleware_js_1.requirePermission)('lessons', 'update'), moduleController_js_1.updateModule)
    .delete((0, authMiddleware_js_1.requirePermission)('lessons', 'delete'), moduleController_js_1.deleteModule);
exports.default = router;
//# sourceMappingURL=moduleRoutes.js.map