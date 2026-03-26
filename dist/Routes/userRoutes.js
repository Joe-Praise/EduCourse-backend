"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_js_1 = require("../Controllers/authController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const userController_js_1 = require("../Controllers/userController.js");
const router = express_1.default.Router();
router.post('/signup', authController_js_1.signup);
router.post('/login', authController_js_1.login);
router.route('/:userId/profile').get(userController_js_1.getProfile);
// Protects all routes after this middleware
router.use(authMiddleware_js_1.protect);
router.patch('/updateMyPassword', authController_js_1.updatePassword);
router.get('/me', userController_js_1.getMe, userController_js_1.getUser);
router.patch('/updateMe', userController_js_1.uploadUserPhoto, userController_js_1.resizePhoto, userController_js_1.updateMe);
router.delete('/deleteMe', userController_js_1.deleteMe);
router.get('/checkToken', authController_js_1.checkToken);
router.use((0, authMiddleware_js_1.requirePermission)('users', 'read'));
router.route('/').get(userController_js_1.getAllUsers);
router
    .route('/:id')
    .get(userController_js_1.getUser)
    .patch((0, authMiddleware_js_1.requirePermission)('users', 'update'), userController_js_1.updateUser)
    .delete((0, authMiddleware_js_1.requirePermission)('users', 'delete'), userController_js_1.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map