"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = exports.updatePassword = exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
// Enterprise utility functions
const signToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Enhanced security
    };
    res.cookie('jwt', token, cookieOptions);
    // Remove sensitive data from output
    const sanitizedUser = { ...user.toObject() };
    delete sanitizedUser.password;
    delete sanitizedUser.confirmPassword;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: sanitizedUser,
        },
    });
};
exports.signup = (0, catchAsync_1.default)(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    // Input validation
    if (!name || !email || !password || !confirmPassword) {
        return next(new appError_1.default('All fields are required', 400));
    }
    if (password !== confirmPassword) {
        return next(new appError_1.default('Passwords do not match', 400));
    }
    try {
        await userModel_1.User.create({
            name,
            email,
            password,
            confirmPassword,
        });
        res.status(201).json({
            status: 'success',
            message: 'User created successfully!',
        });
    }
    catch (error) {
        // Handle duplicate email error
        if (error.code === 11000) {
            return next(new appError_1.default('Email already exists', 409));
        }
        return next(error);
    }
});
exports.login = (0, catchAsync_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    // 1) Input validation
    if (!email || !password) {
        return next(new appError_1.default('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await userModel_1.User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new appError_1.default('Incorrect email or password', 401));
    }
    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});
exports.updatePassword = (0, catchAsync_1.default)(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    // Input validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new appError_1.default('All password fields are required', 400));
    }
    if (newPassword !== confirmPassword) {
        return next(new appError_1.default('New passwords do not match', 400));
    }
    if (!req.user) {
        return next(new appError_1.default('Authentication required', 401));
    }
    // 1) Get the user from the collection
    const user = await userModel_1.User.findById(req.user._id).select('+password');
    if (!user) {
        return next(new appError_1.default('User not found', 404));
    }
    // 2) Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
        return next(new appError_1.default('Your current password is wrong.', 401));
    }
    // 3) Update password
    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    await user.save();
    // 4) Log user in with new token
    createSendToken(user, 200, res);
});
exports.checkToken = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.user) {
        return next(new appError_1.default('Authentication required', 401));
    }
    createSendToken(req.user, 200, res);
});
//# sourceMappingURL=authController.js.map