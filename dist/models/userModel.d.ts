import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const userSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    active: boolean;
    role: ("user" | "instructor" | "admin")[];
    email: string;
    photo: string;
    password: string;
    confirmPassword: string;
    createdAt?: NativeDate;
    updatedAt?: NativeDate;
    passwordChangedAt?: NativeDate;
    passwordResetToken?: string;
    passwordResetExpires?: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    active: boolean;
    role: ("user" | "instructor" | "admin")[];
    email: string;
    photo: string;
    password: string;
    confirmPassword: string;
    createdAt?: NativeDate;
    updatedAt?: NativeDate;
    passwordChangedAt?: NativeDate;
    passwordResetToken?: string;
    passwordResetExpires?: NativeDate;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    active: boolean;
    role: ("user" | "instructor" | "admin")[];
    email: string;
    photo: string;
    password: string;
    confirmPassword: string;
    createdAt?: NativeDate;
    updatedAt?: NativeDate;
    passwordChangedAt?: NativeDate;
    passwordResetToken?: string;
    passwordResetExpires?: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 * createdAt/updatedAt are in the schema definition so InferSchemaType picks them up
 */
type UserType = InferSchemaType<typeof userSchema> & {
    _id: Types.ObjectId;
};
/**
 * Instance methods
 */
interface UserMethods {
    correctPassword(this: UserDoc, candidatePassword: string, userPassword: string): Promise<boolean>;
    changedPasswordAfter(this: UserDoc, JWTTimestamp: number): boolean;
    createPasswordResetToken(this: UserDoc): string;
}
/**
 * Statics
 */
interface UserStatics {
    findByEmail(this: UserModel, email: string): Promise<UserDoc | null>;
}
type UserDoc = HydratedDocument<UserType, UserMethods>;
type UserModel = Model<UserType, {}, UserMethods> & UserStatics;
declare const User: UserModel;
export { User, UserType, UserDoc, UserModel };
//# sourceMappingURL=userModel.d.ts.map