import jwt from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import { User } from '../models/userModel';
import  catchAsync from '../utils/catchAsync';
import  AppError from '../utils/appError';
import { AuthenticatedRequest, LoginRequest, SignupRequest, UpdatePasswordRequest } from '../utils/helper';

// Enterprise utility functions
const signToken = (id: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

const createSendToken = (user: any, statusCode: number, res: Response): void => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const, // Enhanced security
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

export const signup = catchAsync(async (req: SignupRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, confirmPassword } = req.body;

  // Input validation
  if (!name || !email || !password || !confirmPassword) {
    return next(new AppError('All fields are required', 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  try {
    await User.create({
      name,
      email,
      password,
      confirmPassword,
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully!',
    });
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return next(new AppError('Email already exists', 409));
    }
    return next(error);
  }
});

export const login = catchAsync(async (req: LoginRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  // 1) Input validation
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req: UpdatePasswordRequest, res: Response, next: NextFunction): Promise<void> => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Input validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('All password fields are required', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('New passwords do not match', 400));
  }

  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // 1) Get the user from the collection
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 2) Check if current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) Update password
  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save();

  // 4) Log user in with new token
  createSendToken(user, 200, res);
});

export const checkToken = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  createSendToken(req.user, 200, res);
});

// Export types for use in other modules
export type {
  AuthenticatedRequest,
  LoginRequest,
  SignupRequest,
  UpdatePasswordRequest,
};
