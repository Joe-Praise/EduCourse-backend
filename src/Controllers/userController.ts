import multer from 'multer';
import sharp from 'sharp';
import { User } from '../models/userModel.js';
import { Instructor } from '../models/instructorModel.js';
import  AppError from '../utils/appError.js';
import CompletedCourse from '../models/completedcourseModel.js';
import { Course } from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import { getAll, getOne, updateOne, deleteOne } from './handlerFactory.js';
import { formatDate } from '../utils/timeConverter.js';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authController.js';
import APIFeatures from '../utils/apiFeatures.js';
import filterObj from '../utils/filterObj.js';

function convertDate(obj: any[]): any[] {
  let coursesCopy = [...obj];

  coursesCopy = coursesCopy
    .map((el: any) => el._doc)
    .map((el: any) => ({
      ...el,
      createdAt: formatDate(el.createdAt, {format: 'medium'}),
    }));

  return coursesCopy;
}

const multerStorage = multer.memoryStorage();

const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only images.', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single('photo');

export const resizePhoto = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user!._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/${req.file.filename}`);

  next();
});

export const getMe = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.params.id = req.user!._id.toString();
  next();
};

export const updateMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  const updatedUser = await User.findByIdAndUpdate(req.user!._id, filteredBody, {
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

export const deleteMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  await User.findByIdAndUpdate(req.user!._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// export const updateRole =

export const getAllUsers = getAll(User as any);
export const getUser = getOne(User as any);

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    return next(new AppError('User not found', 404));
  }

  let userDetails: any;

  if (existingUser.role.includes('instructor')) {
    const instructor = await Instructor.findOne({ userId });

    if (!instructor) {
      return next(new AppError('Instructor profile not found', 404));
    }

    const features = new APIFeatures(
      Course.find({ instructors: { $in: instructor._id } }),
      {} as any,
    ).filter();

    const courses = await features.query;

    userDetails = {
      user: instructor.toObject(),
      courses,
      isInstructor: true,
    };
  } else if (existingUser.role.includes('user')) {
    const exists = await CompletedCourse.find({ userId });

    // throw error if none is found
    if (!exists.length) {
      userDetails = {
        user: existingUser.toObject(),
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
      user: existingUser.toObject(),
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
export const updateUser = updateOne(User as any);
export const deleteUser = deleteOne(User as any);
