"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("../utils/appError"));
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new appError_1.default(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
    // const value = err.keyValue.name;
    const value = err.message.match(/(["'])(\\?.)*?\1/)?.[0] || 'unknown';
    // console.log(value);
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new appError_1.default(message, 400);
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors || {}).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new appError_1.default(message, 400);
};
const handleJsonWebTokenError = () => {
    const message = 'Invalid token. Please log in again!';
    return new appError_1.default(message, 401);
};
const handleTokenExpiredError = () => {
    const message = 'Your token has expired! Please login in again.';
    return new appError_1.default(message, 401);
};
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send messsage to client
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            status: err.status,
            message: err.message,
        });
        // Programming or other unknown error: don't leak error details
    }
    else {
        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};
exports.default = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        // dont know why using error.name is not working but err.name
        if (err.name === 'CastError')
            err = handleCastErrorDB(err);
        if (err.code === 11000)
            err = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError')
            err = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError')
            err = handleJsonWebTokenError();
        if (err.name === 'TokenExpiredError')
            err = handleTokenExpiredError();
        sendErrorProd(err, res);
    }
};
//# sourceMappingURL=errorController.js.map