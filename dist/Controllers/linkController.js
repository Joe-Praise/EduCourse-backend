"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLink = exports.updateLink = exports.getLink = exports.getAllLinks = exports.createLink = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Link = require('../models/linkModel');
exports.createLink = (0, catchAsync_1.default)(async (req, res, next) => {
    // query for all links linked to the user/instructor
    const exists = await Link.find({
        userId: req.body.userId,
        platform: req.body.platform,
    });
    if (exists.length) {
        return next(new appError_1.default('Link for that platform already exists!', 404));
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
exports.getAllLinks = (0, catchAsync_1.default)(async (req, res, next) => {
    let links = [];
    const { userId } = req.query;
    if (userId) {
        links = await Link.find({ userId });
    }
    else {
        links = await Link.find();
    }
    res.status(200).json({
        status: 'success',
        results: links.length,
        data: links,
    });
});
exports.getLink = (0, handlerFactory_1.getOne)(Link);
exports.updateLink = (0, handlerFactory_1.updateOne)(Link);
exports.deleteLink = (0, handlerFactory_1.deleteOne)(Link);
//# sourceMappingURL=linkController.js.map