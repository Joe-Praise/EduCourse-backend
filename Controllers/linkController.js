const Link = require('../models/linkModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getOne, updateOne, deleteOne } = require('./handlerFactory');

exports.createLink = catchAsync(async (req, res, next) => {
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

exports.getAllLinks = catchAsync(async (req, res, next) => {
  let links = [];
  const { userId } = req.query;

  if (userId) {
    links = await Link.find({ userId });
  } else {
    links = await Link.find();
  }

  res.status(201).json({
    status: 'success',
    results: links.length,
    data: links,
  });
});

exports.getLink = getOne(Link);

exports.updateLink = updateOne(Link);

exports.deleteLink = deleteOne(Link);
