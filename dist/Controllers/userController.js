"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getProfile = exports.getUser = exports.getAllUsers = exports.deleteMe = exports.updateMe = exports.getMe = exports.resizePhoto = exports.uploadUserPhoto = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const userModel_js_1 = require("../models/userModel.js");
const instructorModel_js_1 = require("../models/instructorModel.js");
const appError_js_1 = __importDefault(require("../utils/appError.js"));
const completedcourseModel_js_1 = __importDefault(require("../models/completedcourseModel.js"));
const courseModel_js_1 = require("../models/courseModel.js");
const catchAsync_js_1 = __importDefault(require("../utils/catchAsync.js"));
const handlerFactory_js_1 = require("./handlerFactory.js");
const timeConverter_js_1 = require("../utils/timeConverter.js");
const apiFeatures_js_1 = __importDefault(require("../utils/apiFeatures.js"));
const filterObj_js_1 = __importDefault(require("../utils/filterObj.js"));
function convertDate(obj) {
    let coursesCopy = [...obj];
    coursesCopy = coursesCopy
        .map((el) => el._doc)
        .map((el) => ({
        ...el,
        createdAt: (0, timeConverter_js_1.formatDate)(el.createdAt, { format: 'medium' }),
    }));
    return coursesCopy;
}
const multerStorage = multer_1.default.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    }
    else {
        cb(new appError_js_1.default('Not an image! please upload only images.', 400), false);
    }
};
const upload = (0, multer_1.default)({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.single('photo');
exports.resizePhoto = (0, catchAsync_js_1.default)(async (req, res, next) => {
    if (!req.file)
        return next();
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    await (0, sharp_1.default)(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/${req.file.filename}`);
    next();
});
const getMe = (req, res, next) => {
    req.params.id = req.user._id.toString();
    next();
};
exports.getMe = getMe;
exports.updateMe = (0, catchAsync_js_1.default)(async (req, res, next) => {
    // 1) Create error if user POST's password data
    if (req.body.password || req.body.confirmPassword)
        return next(new appError_js_1.default('This route is not for password updates. Please use /updateMyPassword.', 400));
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = (0, filterObj_js_1.default)(req.body, 'name', 'email');
    if (req.file)
        filteredBody.photo = req.file.filename;
    // 3) Update user document
    const updatedUser = await userModel_js_1.User.findByIdAndUpdate(req.user._id, filteredBody, {
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
exports.deleteMe = (0, catchAsync_js_1.default)(async (req, res, next) => {
    await userModel_js_1.User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
// export const updateRole =
exports.getAllUsers = (0, handlerFactory_js_1.getAll)(userModel_js_1.User);
exports.getUser = (0, handlerFactory_js_1.getOne)(userModel_js_1.User);
exports.getProfile = (0, catchAsync_js_1.default)(async (req, res, next) => {
    const { userId } = req.params;
    const existingUser = await userModel_js_1.User.findById(userId);
    if (!existingUser) {
        return next(new appError_js_1.default('User not found', 404));
    }
    let userDetails;
    if (existingUser.role.includes('instructor')) {
        const instructor = await instructorModel_js_1.Instructor.findOne({ userId });
        if (!instructor) {
            return next(new appError_js_1.default('Instructor profile not found', 404));
        }
        const features = new apiFeatures_js_1.default(courseModel_js_1.Course.find({ instructors: { $in: instructor._id } }), {}).filter();
        const courses = await features.query;
        userDetails = {
            user: instructor.toObject(),
            courses,
            isInstructor: true,
        };
    }
    else if (existingUser.role.includes('user')) {
        const exists = await completedcourseModel_js_1.default.find({ userId });
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
        const features = new apiFeatures_js_1.default(courseModel_js_1.Course.find({
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
        return next(new appError_js_1.default('User not found!', 404));
    }
    // console.log(userDetails.courses);
    if (userDetails.courses) {
        userDetails.courses = convertDate(userDetails.courses);
    }
    return res.status(200).json(userDetails);
});
// Do not update password with this!
exports.updateUser = (0, handlerFactory_js_1.updateOne)(userModel_js_1.User);
exports.deleteUser = (0, handlerFactory_js_1.deleteOne)(userModel_js_1.User);
//# sourceMappingURL=userController.js.map