"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const allowedOrigins_js_1 = __importDefault(require("./allowedOrigins.js"));
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins_js_1.default.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200, // Fixed typo: was "optionSuccessStatus"
};
exports.default = corsOptions;
//# sourceMappingURL=corsOptions.js.map