"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const constants_1 = require("../utils/constants");
/**
 * 1. Define schema (single source of truth)
 */
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name"],
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator_1.default.isEmail, "Please provide a valid email"],
    },
    photo: { type: String, default: "default.jpg" },
    role: {
        type: [String],
        enum: constants_1.roles,
        default: ["user"],
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minLength: [8, "Password must be at least 8 characters"],
        select: false,
    },
    confirmPassword: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            validator(el) {
                return el === this.password;
            },
            message: "Passwords do not match",
        },
    },
    passwordChangedAt: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        select: false,
    },
});
/**
 * 6. Add methods
 */
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return bcryptjs_1.default.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
/**
 * 7. Add statics
 */
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email });
};
/**
 * 8. Middleware (typed this)
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcryptjs_1.default.hash(this.password, 12);
    delete this.confirmPassword;
    next();
});
/**
 * 9. Export model
 */
const User = (0, mongoose_1.model)("User", userSchema);
exports.User = User;
//# sourceMappingURL=userModel.js.map