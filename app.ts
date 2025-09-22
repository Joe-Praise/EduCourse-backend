import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import  AppError from './utils/appError.js';
import globalHandlerError from './Controllers/errorController.js';
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
import corsOptions from './config/corsOptions.js';
import credentials from './utils/credentials.js';

// Extend Request interface for custom properties
interface CustomRequest extends Request {
  requestTime?: string;
}

const app = express();

// Handle options credentials check- before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross origin Resource Sharing
app.use(cors(corsOptions));

// 1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit request from the same API
const limiter = rateLimit({
  max: 100000,
  windowMs: 60 * 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Trust the 'X-Forwarded-For' header
app.set('trust proxy', 1);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization againt NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// app.use('/', (req, res) => {
//   const welcome =
//     'Welcome to Building Tips! A place where all building professionals get updated on the best building practices required on the field.';
//   res.json({ welcome });
// });

app.use(compression());

// Test middleware
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
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

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

// TODO: get the global error handler working and use it here
app.use(globalHandlerError);

export default app;
