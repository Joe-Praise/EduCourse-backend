import type { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

interface MongoError extends Error {
  path?: string;
  value?: any;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
  code?: number;
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

const handleCastErrorDB = (err: MongoError): InstanceType<typeof AppError> => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: MongoError): InstanceType<typeof AppError> => {
  // const value = err.keyValue.name;
  const value = err.message.match(/(["'])(\\?.)*?\1/)?.[0] || 'unknown';
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: MongoError): InstanceType<typeof AppError> => {
  const errors = Object.values(err.errors || {}).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = (): InstanceType<typeof AppError> => {
  const message = 'Invalid token. Please log in again!';
  return new AppError(message, 401);
};

const handleTokenExpiredError = (): InstanceType<typeof AppError> => {
  const message = 'Your token has expired! Please login in again.';
  return new AppError(message, 401);
};

const sendErrorDev = (err: MongoError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: MongoError, res: Response): void => {
  // Operational, trusted error: send messsage to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

export default (err: MongoError, req: Request, res: Response, next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // dont know why using error.name is not working but err.name
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') err = handleTokenExpiredError();

    sendErrorProd(err, res);
  }
};
