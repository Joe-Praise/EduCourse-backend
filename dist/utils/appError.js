"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApplicationError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
const AppError = ApplicationError;
exports.default = AppError;
//# sourceMappingURL=appError.js.map