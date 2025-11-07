import type { Request, Response, NextFunction } from 'express';
import  catchAsync from '../utils/catchAsync.js';
import  AppError from '../utils/appError.js';
import { getAll, updateOne, deleteOne, getOne } from './handlerFactory.js';

// Import CommonJS modules
import { Instructor } from "../models/instructorModel.js";
import { User } from "../models/userModel.js";
import filterObj from "../utils/filterObj.js";

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: string[];
  };
}

interface InstructorData {
  _id: string;
  [key: string]: any;
}

function getUniqueInstructorId(instructors: InstructorData[]): string[] {
  if (!instructors.length) return [];
  const cache: Record<string, boolean> = {};

  for (let i = 0; i < instructors.length; i += 1) {
    if (!cache[instructors[i]._id]) {
      cache[instructors[i]._id] = true;
    }
  }

  return Object.keys(cache);
}

export const createInstructor = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const admin = ['admin'];
  const isAdmin = admin.some((el) => req.user!.role.indexOf(el) !== -1);

  const { userId, links } = req.body;

  const query = isAdmin === true ? { userId } : { userId: req.user!._id };

  // if admin use userId from body else use logged in userId
  const instructorCheck = await Instructor.find(query);

  // checj for existing instructor
  if (instructorCheck.length) {
    return next(new AppError('Document already exists', 404));
  }

  // get user from user collection
  const user = await User.findById({ _id: userId });

  if (!user) {
    next(new AppError('User does not exist!', 404));
  }

  const userCopy = user ? user.toObject() : undefined;
  if (userCopy) {
    userCopy.role.push('instructor');
    user?.overwrite({ ...userCopy });
    await user?.save({ validateBeforeSave: false });
  }

  const instructor = await Instructor.create({
    userId,
    links,
  });

  return res.status(201).json({
    status: 'success',
    data: instructor,
  });
});

export const updateMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const filteredBody = filterObj(req.body, 'links');
  const instructor = await Instructor.findOne({
    userId: req.user!._id,
  });

  if (!instructor) {
    return next(new AppError('Instructor does not exist!', 404));
  }

  const data = (instructor as any)._doc;

  instructor.overwrite({ ...data, ...filteredBody });
  await instructor.save();
  res.status(200).json({
    status: 'success',
    data: {
      instructor: instructor,
    },
  });
});

export const deleteMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const instructor = await Instructor.findOne({
    userId: req.user!._id,
  });

  if (!instructor) {
    return next(new AppError('Instructor does not exist!', 404));
  }

  await Instructor.findByIdAndUpdate(instructor._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getAllInstructors = getAll(Instructor);

// Interface for requests with registered courses
interface RegisteredCoursesRequest extends Request {
  registeredCourses?: Array<{
    courseId: {
      instructors: InstructorData[];
    };
  }>;
}

export const getMyLearningInstructors = catchAsync(async (req: RegisteredCoursesRequest, res: Response, next: NextFunction) => {
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
    .map((course: any) => course.courseId.instructors)
    .flatMap((el: any) => el);

  // Get unique id's from arr of id's
  const uniqueInstructors = getUniqueInstructorId(getInstructorsId);

  // find instructors with those id's
  const data = await Instructor.find({ _id: { $in: uniqueInstructors } });

  res.status(200).json({
    status: 'success',
    data: data,
  });
});

export const getOneInstructor = getOne(Instructor);

export const updateInstructor = updateOne(Instructor);

export const deleteInstructor = deleteOne(Instructor);

// id is the particular instructor id not userId
export const suspendInstructor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const instructor = await Instructor.findById(id);

  if (!instructor) {
    return next(new AppError('Instructor does not exist!', 404));
  }

  await Instructor.findByIdAndUpdate(instructor._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
