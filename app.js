const path = require('path');
const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalHandlerError = require('./Controllers/errorController');
const userRouter = require('./Routes/userRoutes');
const courseRouter = require('./Routes/courseRoutes');
const completedCourses = require('./Routes/completedCoureseRoutes');
const instructorRouter = require('./Routes/instructorRoutes');
const reviewRouter = require('./Routes/reviewRoutes');
const categoryRouter = require('./Routes/categoryRoutes');
const blogRouter = require('./Routes/blogRoutes');
const tagRouter = require('./Routes/tagRoutes');
const blogCommentRouter = require('./Routes/blogCommentRoutes');
const courseModuleRouter = require('./Routes/moduleRoutes');
const lessonRouter = require('./Routes/lessonRoutes');
const linkRouter = require('./Routes/linkRoutes');
const corsOptions = require('./config/corsOptions');
const credentials = require('./utils/credentials');

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
  max: 100,
  windowMs: 60 * 60 * 1000,
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
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 2) ROUTES
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

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

// TODO: get the global error handler working and use it here
app.use(globalHandlerError);
module.exports = app;
