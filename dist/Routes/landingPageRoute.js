"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const landingPageController_js_1 = require("../Controllers/landingPageController.js");
const router = express_1.default.Router();
router.route('/').get(landingPageController_js_1.landingPage);
exports.default = router;
//# sourceMappingURL=landingPageRoute.js.map