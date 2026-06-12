import { logger } from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
import compression from 'compression';
import AppError from './utils/appError.js';
import globalHandlerError from './Controllers/errorController.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import landingPageRouter from './Routes/landingPageRoute.js';
import userRouter from './Routes/userRoutes.js';
import courseRouter from './Routes/courseRoutes.js';
import completedCourses from './Routes/completedCoureseRoutes.js';
import instructorRouter from './Routes/instructorRoutes.js';
import reviewRouter from './Routes/reviewRoutes.js';
import categoryRouter from './Routes/categoryRoutes.js';
import blogRouter from './Routes/blogRoutes.js';
import tagRouter from './Routes/tagRoutes.js';
import blogCommentRouter from './Routes/blogCommentRoutes.js';
import courseModuleRouter from './Routes/moduleRoutes.js';
import lessonRouter from './Routes/lessonRoutes.js';
import linkRouter from './Routes/linkRoutes.js';
import certificateRouter from './Routes/certificateRoutes.js';
import enrollmentRouter from './Routes/enrollmentRoutes.js';
import wishlistRouter from './Routes/wishlistRoutes.js';
import notificationRouter from './Routes/notificationRoutes.js';
import earningRouter from './Routes/earningRoutes.js';
import aiRouter from './Routes/aiRoutes.js';
import searchRouter from './Routes/searchRoutes.js';
import agentCallbackRouter from './Routes/agentCallbackRoutes.js';
import platformRouter from './Routes/platformRoutes.js';
import corsOptions from './config/corsOptions.js';
import credentials from './utils/credentials.js';
import { sessionMiddleware } from './config/redisSession.js';
import { globalLimiter } from './middlewares/rateLimiter.js';

// Extend Request interface for custom properties
interface CustomRequest extends Request {
  requestTime?: string;
}

const app = express();

app.use(sessionMiddleware);

// app.use((req, res, next) => {
//   logger.debug("SessionID:", req.sessionID);
//   logger.debug("Session:", req.session);
//   next();
// });

// Handle options credentials check- before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross origin Resource Sharing
app.use(cors(corsOptions));

// HTTP security headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security,
// Referrer-Policy, etc.). CSP intentionally disabled because Cloudinary asset URLs + the
// frontend's dynamic styling would otherwise need an extensive directive list. Re-enable
// once we have a known asset/CDN allowlist.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// 1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));
app.use('/user', express.static(path.join(__dirname, 'public/img')));

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// // limit request from the same API
// const limiter = rateLimit({
//   max: 100000,
//   windowMs: 60 * 60 * 60 * 1000,
//   message: 'Too many requests from this IP, please try again in an hour!',
// });

app.use('/api', globalLimiter);

// Trust the 'X-Forwarded-For' header
app.set('trust proxy', 1);

// Agent callback routes (/api/v1/admin/*) receive large, AUTHENTICATED
// payloads from the agent-service — e.g. a youtube-course-discovery import can
// carry several courses' worth of modules + videos (10KB+). Parse those with a
// generous limit FIRST so they aren't rejected by the global 10kb cap below.
// This parser only matches /api/v1/admin; once it parses, the global parser
// skips the request (req._body is set). Everything else keeps the tight 10kb
// limit, which is the deliberate anti-DoS bound on user-facing routes.
app.use('/api/v1/admin', express.json({ limit: '2mb' }));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Parse cookies — required for refresh token (`rt`) + access token (`jwt`)
// reads in the auth flow. Must come before any route that reads req.cookies.
app.use(cookieParser());

// Data sanitization againt NoSQL query injection
app.use(mongoSanitize());

app.use('/docs', (req, res) => {
  const welcome =
    'Welcome to Building Tips! A place where all building professionals get updated on the best building practices required on the field.';
  res.json({ welcome });
});

app.use(compression());

// Test middleware
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  // logger.debug(req.headers);
  next();
});

// 2) ROUTES
app.use('/api/v1/', landingPageRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/category', categoryRouter);
app.use('/api/v1/completed-courses', completedCourses);
app.use('/api/v1/instructors', instructorRouter);
app.use('/api/v1/blogs', blogRouter);
app.use('/api/v1/tags', tagRouter);
app.use('/api/v1/comments', blogCommentRouter);
app.use('/api/v1/modules', courseModuleRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/v1/links', linkRouter);
app.use('/api/v1/certificates', certificateRouter);
app.use('/api/v1/enrollments', enrollmentRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/earnings', earningRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/admin', agentCallbackRouter);
app.use('/api/v1/platform', platformRouter);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

// TODO: get the global error handler working and use it here
app.use(globalHandlerError);

export default app;
