const multer = require('multer');
const sharp = require('sharp');
const dayjs = require('dayjs');
const User = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const AppError = require('../utils/appError');
const CompletedCourse = require('../models/completedcourseModel');
const Course = require('../models/courseModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const { getAll, getOne, updateOne, deleteOne } = require('./handlerFactory');
const filterObj = require('../utils/filterObj');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

function convertDate(obj) {
  let coursesCopy = [...obj];

  coursesCopy = coursesCopy
    .map((el) => el._doc)
    .map((el) => ({
      ...el,
      createdAt: dayjs(el.createdAt).format('MMMM D, YYYY'),
    }));

  return coursesCopy;
}

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only images.', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// const filterObj = (obj, ...allowedFields) => {
//   const newObj = {};
//   Object.keys(obj).forEach((el) => {
//     if (allowedFields.includes(el)) newObj[el] = obj[el];
//   });

//   return newObj;
// };

// npm install --os=win32 --cpu=x64 sharp
// npm install --force @img/sharp-win32-x64

exports.uploadUserPhoto = upload.single('photo');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/${req.file.filename}`);

  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POST's password data
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// exports.updateRole =

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);

exports.getProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    return next(new AppError('User not found', 404));
  }

  let userDetails;

  if (existingUser.role.includes('instructor')) {
    const instructor = await Instructor.findOne({ userId });

    const features = new APIFeatures(
      Course.find({ instructors: { $in: instructor._id } }),
      '',
    ).filter();

    const courses = await features.query;

    userDetails = {
      user: { ...instructor._doc },
      courses,
      isInstructor: true,
    };
  } else if (existingUser.role.includes('user')) {
    const exists = await CompletedCourse.find({ userId });

    // throw error if none is found
    if (!exists.length) {
      userDetails = {
        user: { ...existingUser._doc },
        courses: [],
        isInstructor: false,
      };
      return res.status(200).json(userDetails);
    }

    const courseArr = exists.flatMap((el) => el.courseId._id);

    req.query.completed = undefined;

    const features = new APIFeatures(
      Course.find({
        _id: { $in: courseArr },
      }),
      req.query,
    ).filter();

    const courses = await features.query;

    userDetails = {
      user: { ...existingUser._doc },
      courses,
      isInstructor: false,
    };
  } else {
    return next(new AppError('User not found!', 404));
  }
  // console.log(userDetails.courses);

  if (userDetails.courses) {
    userDetails.courses = convertDate(userDetails.courses);
  }

  return res.status(200).json(userDetails);
});

// Do not update password with this!
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
