"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendInstructor = exports.deleteInstructor = exports.updateInstructor = exports.getOneInstructor = exports.getMyLearningInstructors = exports.getAllInstructors = exports.deleteMe = exports.updateMe = exports.createInstructor = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Instructor = require('../models/instructorModel');
const User = require('../models/userModel');
const filterObj = require('../utils/filterObj');
function getUniqueInstructorId(instructors) {
    if (!instructors.length)
        return [];
    const cache = {};
    for (let i = 0; i < instructors.length; i += 1) {
        if (!cache[instructors[i]._id]) {
            cache[instructors[i]._id] = true;
        }
    }
    return Object.keys(cache);
}
exports.createInstructor = (0, catchAsync_1.default)(async (req, res, next) => {
    const admin = ['admin'];
    const isAdmin = admin.some((el) => req.user.role.indexOf(el) !== -1);
    const { userId, links } = req.body;
    const query = isAdmin === true ? { userId } : { userId: req.user._id };
    // if admin use userId from body else use logged in userId
    const instructorCheck = await Instructor.find(query);
    // checj for existing instructor
    if (instructorCheck.length) {
        return next(new appError_1.default('Document already exists', 404));
    }
    // get user from user collection
    const user = await User.findById({ _id: userId });
    if (!user) {
        next(new appError_1.default('User does not exist!', 404));
    }
    const userCopy = user._doc;
    userCopy.role.push('instructor');
    user.overwrite({ ...userCopy });
    user.save({ validateBeforeSave: false });
    const instructor = await Instructor.create({
        userId,
        links,
    });
    return res.status(201).json({
        status: 'success',
        data: instructor,
    });
});
exports.updateMe = (0, catchAsync_1.default)(async (req, res, next) => {
    const filteredBody = filterObj(req.body, 'links');
    const instructor = await Instructor.findOne({
        userId: req.user._id,
    });
    if (!instructor) {
        return next(new appError_1.default('Instructor does not exist!', 404));
    }
    const data = instructor._doc;
    instructor.overwrite({ ...data, ...filteredBody });
    await instructor.save();
    res.status(200).json({
        status: 'success',
        data: {
            instructor: instructor,
        },
    });
});
exports.deleteMe = (0, catchAsync_1.default)(async (req, res, next) => {
    const instructor = await Instructor.findOne({
        userId: req.user._id,
    });
    if (!instructor) {
        return next(new appError_1.default('Instructor does not exist!', 404));
    }
    await Instructor.findByIdAndUpdate(instructor._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
exports.getAllInstructors = (0, handlerFactory_1.getAll)(Instructor);
exports.getMyLearningInstructors = (0, catchAsync_1.default)(async (req, res, next) => {
    // used middleware in completedCourse controller to get this data
    const { registeredCourses } = req;
    if (!registeredCourses) {
        return res.status(200).json({
            status: 'success',
            data: [],
        });
    }
    // Get instructors id from courses user is registered for
    const getInstructorsId = registeredCourses
        .map((course) => course.courseId.instructors)
        .flatMap((el) => el);
    // Get unique id's from arr of id's
    const uniqueInstructors = getUniqueInstructorId(getInstructorsId);
    // find instructors with those id's
    const data = await Instructor.find({ _id: { $in: uniqueInstructors } });
    res.status(200).json({
        status: 'success',
        data: data,
    });
});
exports.getOneInstructor = (0, handlerFactory_1.getOne)(Instructor);
exports.updateInstructor = (0, handlerFactory_1.updateOne)(Instructor);
exports.deleteInstructor = (0, handlerFactory_1.deleteOne)(Instructor);
// id is the particular instructor id not userId
exports.suspendInstructor = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const instructor = await Instructor.findById(id);
    if (!instructor) {
        return next(new appError_1.default('Instructor does not exist!', 404));
    }
    await Instructor.findByIdAndUpdate(instructor._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
//# sourceMappingURL=instructorController.js.map