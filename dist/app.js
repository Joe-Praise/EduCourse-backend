"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const cors_1 = __importDefault(require("cors"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const appError_js_1 = __importDefault(require("./utils/appError.js"));
const errorController_js_1 = __importDefault(require("./Controllers/errorController.js"));
const landingPageRoute_js_1 = __importDefault(require("./Routes/landingPageRoute.js"));
const userRoutes_js_1 = __importDefault(require("./Routes/userRoutes.js"));
const courseRoutes_js_1 = __importDefault(require("./Routes/courseRoutes.js"));
const completedCoureseRoutes_js_1 = __importDefault(require("./Routes/completedCoureseRoutes.js"));
const instructorRoutes_js_1 = __importDefault(require("./Routes/instructorRoutes.js"));
const reviewRoutes_js_1 = __importDefault(require("./Routes/reviewRoutes.js"));
const categoryRoutes_js_1 = __importDefault(require("./Routes/categoryRoutes.js"));
const blogRoutes_js_1 = __importDefault(require("./Routes/blogRoutes.js"));
const tagRoutes_js_1 = __importDefault(require("./Routes/tagRoutes.js"));
const blogCommentRoutes_js_1 = __importDefault(require("./Routes/blogCommentRoutes.js"));
const moduleRoutes_js_1 = __importDefault(require("./Routes/moduleRoutes.js"));
const lessonRoutes_js_1 = __importDefault(require("./Routes/lessonRoutes.js"));
const linkRoutes_js_1 = __importDefault(require("./Routes/linkRoutes.js"));
const corsOptions_js_1 = __importDefault(require("./config/corsOptions.js"));
const credentials_js_1 = __importDefault(require("./utils/credentials.js"));
const app = (0, express_1.default)();
// Handle options credentials check- before CORS!
// and fetch cookies credentials requirement
app.use(credentials_js_1.default);
// Cross origin Resource Sharing
app.use((0, cors_1.default)(corsOptions_js_1.default));
// 1) GLOBAL MIDDLEWARES
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// development logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// limit request from the same API
const limiter = (0, express_rate_limit_1.default)({
    max: 100000,
    windowMs: 60 * 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);
// Trust the 'X-Forwarded-For' header
app.set('trust proxy', 1);
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '10kb' }));
// Data sanitization againt NoSQL query injection
app.use((0, express_mongo_sanitize_1.default)());
// Data sanitization against XSS
app.use((0, xss_clean_1.default)());
// app.use('/', (req, res) => {
//   const welcome =
//     'Welcome to Building Tips! A place where all building professionals get updated on the best building practices required on the field.';
//   res.json({ welcome });
// });
app.use((0, compression_1.default)());
// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});
// 2) ROUTES
app.use('/api/v1/', landingPageRoute_js_1.default);
app.use('/api/v1/users', userRoutes_js_1.default);
app.use('/api/v1/reviews', reviewRoutes_js_1.default);
app.use('/api/v1/courses', courseRoutes_js_1.default);
app.use('/api/v1/category', categoryRoutes_js_1.default);
app.use('/api/v1/completed-courses', completedCoureseRoutes_js_1.default);
app.use('/api/v1/instructors', instructorRoutes_js_1.default);
app.use('/api/v1/blogs', blogRoutes_js_1.default);
app.use('/api/v1/tags', tagRoutes_js_1.default);
app.use('/api/v1/comments', blogCommentRoutes_js_1.default);
app.use('/api/v1/modules', moduleRoutes_js_1.default);
app.use('/api/v1/lessons', lessonRoutes_js_1.default);
app.use('/api/v1/links', linkRoutes_js_1.default);
app.all('*', (req, res, next) => {
    next(new appError_js_1.default(`Can't find ${req.originalUrl} on the server!`, 404));
});
// TODO: get the global error handler working and use it here
app.use(errorController_js_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map