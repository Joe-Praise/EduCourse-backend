import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types
} from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import { roles } from "../utils/constants";

/**
 * 1. Define schema (single source of truth)
 */
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
    validate: {
      validator(this: any, el: string) {
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
 * 2. Infer base type from schema (no duplication!)
 */
type UserType = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId }

/**
 * 3. Define instance methods
 */
interface UserMethods {
  correctPassword(
    this: UserDoc,
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;

  changedPasswordAfter(this: UserDoc, JWTTimestamp: number): boolean;
}

/**
 * 4. Define statics (optional)
 */
interface UserStatics {
  findByEmail(this: UserModel, email: string): Promise<UserDoc | null>;
}

/**
 * 5. Combine into document & model types
 */
type UserDoc = HydratedDocument<UserType, UserMethods>;
type UserModel = Model<UserType, {}, UserMethods> & UserStatics;

/**
 * 6. Add methods
 */
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * 7. Add statics
 */
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

/**
 * 8. Middleware (typed this)
 */
userSchema.pre<UserDoc>("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  delete (this as any).confirmPassword;

  next();
});

/**
 * 9. Export model
 */
const User = model<UserType, UserModel>("User", userSchema);

export { User, UserType, UserDoc, UserModel };
