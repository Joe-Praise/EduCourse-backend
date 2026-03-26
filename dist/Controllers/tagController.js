"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTag = exports.updateTag = exports.getTag = exports.getAllTags = exports.createTag = void 0;
const handlerFactory_1 = require("./handlerFactory");
// Import CommonJS modules
const Tag = require('../models/tagModel');
exports.createTag = (0, handlerFactory_1.createOne)(Tag);
exports.getAllTags = (0, handlerFactory_1.getAll)(Tag);
exports.getTag = (0, handlerFactory_1.getOne)(Tag);
exports.updateTag = (0, handlerFactory_1.updateOne)(Tag);
exports.deleteTag = (0, handlerFactory_1.deleteOne)(Tag);
//# sourceMappingURL=tagController.js.map