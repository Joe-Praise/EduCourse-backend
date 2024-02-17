// const APIFeatures = require('../utils/apiFeatures');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Pagination = require('../utils/paginationFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const doc = await Model.findByIdAndDelete(req.params.id);
    const doc = await Model.findByIdAndUpdate(req.params.id, { active: false });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // checking if the course document already exists
    if (popOptions) {
      // getting the field value from the popOptions
      const check = popOptions.field;

      // interpolating the string e.g queryStr = `req.body.title`
      const queryStr = `req.body.${[check]}`;

      const exists = await Model.find({ [check]: queryStr });

      if (exists.length) {
        return next(new AppError('Document already exists', 404));
      }
    }

    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // const { slug } = req.query;
    // let query;
    // if (slug) {
    //   query = Model.find({ slug });
    // } else {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    doc.active = undefined;
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const { slug } = req.query;

    let query;
    if (slug) {
      query = Model.find({ slug });

      const data = await query;

      res.status(200).json({
        status: 'success',
        data,
      });
    } else {
      const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sorting()
        .limitFields();

      query = await features.query;

      const paginate = new Pagination(req.query).pagination(query);

      // do not retrun active status as response
      // doc.active = undefined;
      // SEND RESPONSE
      res.status(200).json({
        status: 'success',
        metaData: paginate.metaData,
        data: paginate.data,
      });
    }
  });

exports.searchModel = (Model) =>
  catchAsync(async (req, res, next) => {
    const { search } = req.query;

    const doc = await Model.find(
      { $text: { $search: search } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .lean();

    doc.active = undefined;
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });
