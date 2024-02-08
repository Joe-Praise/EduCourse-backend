// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
    let { page, limit } = req.query;

    // console.log(page, limit);
    let query;
    if (slug) {
      query = Model.find({ slug });
    } else {
      page = Number(page) || 1;
      limit = Number(limit) || 6;

      // handle pagonation
      //   query = Model.aggregate([
      //     {
      //       $facet: {
      //         metaData: [
      //           {
      //             $count: 'totalDocuments',
      //           },
      //           {
      //             $addFields: {
      //               pageNumber: page,
      //               totalPages: {
      //                 $ceil: { $divide: ['$totalDocuments', limit] },
      //               },
      //             },
      //           },
      //         ],
      //         data: [
      //           {
      //             $skip: (page - 1) * limit,
      //           },
      //           {
      //             $limit: limit,
      //           },
      //         ],
      //       },
      //     },
      //     {
      //       $lookup:{

      //       }
      //     }
      //   ]);
      // }

      query = Model.find()
        .skip((page - 1) * limit)
        .limit(limit);

      const doc = await query;

      const metaData = {
        pageNumber: page,
        count: doc.length,
        limit,
      };

      // do not retrun active status as response
      // doc.active = undefined;
      // SEND RESPONSE
      res.status(200).json({
        status: 'success',
        metaData,
        doc,
      });
    }
  });
