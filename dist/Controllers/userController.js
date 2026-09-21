import multer from 'multer';
import { User } from '../models/userModel.js';
import { uploadBufferToCloudinary } from '../utils/cloudinary.js';
import { Instructor } from '../models/instructorModel.js';
import AppError from '../utils/appError.js';
import { CompletedCourse } from '../models/completedcourseModel.js';
import { Course } from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import { getAll, getOne, updateOne, deleteOne } from './handlerFactory.js';
import { formatDate } from '../utils/timeConverter.js';
import { CacheEvent } from '../events/cache/cache.events.js';
// Import cache events to register listeners
import '../events/cache/userCache.events.js';
import APIFeatures from '../utils/apiFeatures.js';
import filterObj from '../utils/filterObj.js';
function convertDate(obj) {
    let coursesCopy = [...obj];
    coursesCopy = coursesCopy
        .map((el) => el._doc)
        .map((el) => ({
        ...el,
        createdAt: formatDate(el.createdAt, { format: 'medium' }),
    }));
    return coursesCopy;
}
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    }
    else {
        cb(new AppError('Not an image! please upload only images.', 400), false);
    }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
export const uploadUserPhoto = upload.single('photo');
export const resizePhoto = catchAsync(async (req, _res, next) => {
    if (!req.file)
        return next();
    const result = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        publicId: `building-safety/users/${req.user._id}`,
    });
    req.file.filename = result.secure_url;
    next();
});
export const getMe = (req, res, next) => {
    req.params.id = req.user._id.toString();
    next();
};
export const updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POST's password data
    if (req.body.password || req.body.confirmPassword)
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file)
        filteredBody.photo = req.file.filename;
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
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
export const deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
// export const updateRole =
export const getAllUsers = getAll(User);
export const getUser = getOne(User);
export const getProfile = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const existingUser = await User.findById(userId);
    if (!existingUser) {
        return next(new AppError('User not found', 404));
    }
    let userDetails;
    if (existingUser.role.includes('instructor')) {
        const instructor = await Instructor.findOne({ userId });
        if (!instructor) {
            return next(new AppError('Instructor profile not found', 404));
        }
        const features = new APIFeatures(Course.find({ instructors: instructor._id }), {}).filter();
        const courses = await features.query;
        userDetails = {
            user: instructor.toObject(),
            courses,
            isInstructor: true,
        };
    }
    else if (existingUser.role.includes('user')) {
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
        const courseArr = exists.flatMap((el) => el.courseId);
        req.query.completed = undefined;
        const features = new APIFeatures(Course.find({
            _id: { $in: courseArr },
        }), req.query).filter();
        const courses = await features.query;
        userDetails = {
            user: existingUser.toObject(),
            courses,
            isInstructor: false,
        };
    }
    else {
        return next(new AppError('User not found!', 404));
    }
    // logger.debug(userDetails.courses);
    if (userDetails.courses) {
        userDetails.courses = convertDate(userDetails.courses);
    }
    return res.status(200).json(userDetails);
});
// Do not update password with this!
export const updateUser = updateOne(User, {
    cachePattern: CacheEvent.USER.UPDATED,
});
export const deleteUser = deleteOne(User, {
    cachePattern: CacheEvent.USER.DELETED,
});
//# sourceMappingURL=userController.js.map