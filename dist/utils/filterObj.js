"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el))
            newObj[el] = obj[el];
    });
    return newObj;
};
exports.default = filterObj;
//# sourceMappingURL=filterObj.js.map