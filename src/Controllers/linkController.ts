import type { Request, Response, NextFunction } from 'express';
import  catchAsync from '../utils/catchAsync.js';
import  AppError  from '../utils/appError.js';
import { getOne, updateOne, deleteOne } from './handlerFactory.js';

// Import CommonJS modules
import { Link } from "../models/linkModel.js";

export const createLink = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // query for all links linked to the user/instructor
  const exists = await Link.find({
    userId: req.body.userId,
    platform: req.body.platform,
  });

  if (exists.length) {
    return next(new AppError('Link for that platform already exists!', 404));
  }

  //   create the module if all cases are passed
  const link = await Link.create({
    userId: req.body.userId,
    platform: req.body.platform,
    url: req.body.url,
  });

  res.status(201).json({
    status: 'success',
    data: link,
  });
});

export const getAllLinks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let links: any[] = [];
  const { userId } = req.query;

  if (userId) {
    links = await Link.find({ userId });
  } else {
    links = await Link.find();
  }

  res.status(200).json({
    status: 'success',
    results: links.length,
    data: links,
  });
});

export const getLink = getOne(Link);

export const updateLink = updateOne(Link);

export const deleteLink = deleteOne(Link);
