const sharp = require('sharp');
const Blog = require('../models/blogModel');
const catchAsync = require('../utils/catchAsync');
const upload = require('../utils/handleImageUpload');
const { getOne, updateOne, createOne, deleteOne } = require('./handlerFactory');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const Pagination = require('../utils/paginationFeatures');

const BLOG_AUTOCOMPLETE_INDEX_NAME = 'blogAutocomplete';

exports.createBlog = createOne(Blog, { field: 'title' });
// exports.getAllBlog = getAll(Blog);
exports.getBlog = getOne(Blog, { path: 'comments' });
exports.updateBlog = updateOne(Blog);
exports.deleteBlog = deleteOne(Blog);

exports.setCoverImage = upload.single('imageCover');

exports.atlasAutocomplete = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const pipeline = [];

  if (!query || query.length < 2) {
    return res.status(200).json({
      status: 'success',
      data: [],
    });
  }

  pipeline.push({
    $search: {
      index: BLOG_AUTOCOMPLETE_INDEX_NAME,
      autocomplete: {
        query,
        path: 'title',
        tokenOrder: 'sequential',
        fuzzy: {},
      },
    },
  });

  pipeline.push({
    $project: {
      score: { $meta: 'searchScore' },
      title: 1,
      slug: 1,
    },
  });

  const result = await Blog.aggregate(pipeline).sort({ score: -1 }).limit(10);
  // const array = await result.toArray();
  // console.log(result);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.getAllBlog = catchAsync(async (req, res, next) => {
  const { slug } = req.query;

  let query;
  if (slug) {
    query = Blog.find({ slug });

    const doc = await query;

    doc[0].active = undefined;
    const copy = doc[0]._doc;

    const data = [copy];

    res.status(200).json({
      status: 'success',
      data,
    });
  } else {
    // used to identify fields to run mongoose reference search on
    const referencedProperties = ['category', 'tag'];
    const features = new APIFeatures(Blog.find(), req.query)
      .filter(referencedProperties)
      .sorting()
      .limitFields();

    query = await features.query;

    const paginate = new Pagination(req.query).pagination(query);

    // do not retrun active status as response
    // doc.active = undefined;
    res.status(200).json({
      status: 'success',
      metaData: paginate.metaData,
      data: paginate.data,
    });
  }
});

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `blog-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(700, 700)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/blog/${req.file.filename}`);

  next();
});

exports.uploadResources = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('This route is for only resources.', 400));
  }

  req.body.imageCover = req.file.filename;

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedBlog,
    },
  });
});
