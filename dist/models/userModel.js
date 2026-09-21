import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";
import { roles } from "../utils/constants.js";
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name"],
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    photo: { type: String, default: "default.jpg" },
    role: {
        type: [String],
        enum: roles,
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
        select: false,
        validate: {
            validator(el) {
                return el === this.password;
            },
            message: "Passwords do not match",
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    // Explicitly defined so select:false applies to Mongoose-managed timestamps
    createdAt: { type: Date, select: false },
    updatedAt: { type: Date, select: false },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
}, { timestamps: true });
/**
 * Methods
 */
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
userSchema.methods.createPasswordResetToken = function () {
    const rawToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return rawToken;
};
/**
 * Statics
 */
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email });
};
/**
 * Middleware
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
});
const User = model("User", userSchema);
export { User };
//# sourceMappingURL=userModel.js.map