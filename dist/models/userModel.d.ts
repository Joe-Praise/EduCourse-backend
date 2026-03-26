import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const userSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    createdAt: NativeDate;
    name: string;
    email: string;
    photo: string;
    role: ("user" | "instructor" | "admin")[];
    password: string;
    confirmPassword: string;
    active: boolean;
    passwordChangedAt?: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    name: string;
    email: string;
    photo: string;
    role: ("user" | "instructor" | "admin")[];
    password: string;
    confirmPassword: string;
    active: boolean;
    passwordChangedAt?: NativeDate;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    name: string;
    email: string;
    photo: string;
    role: ("user" | "instructor" | "admin")[];
    password: string;
    confirmPassword: string;
    active: boolean;
    passwordChangedAt?: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type UserType = InferSchemaType<typeof userSchema> & {
    _id: Types.ObjectId;
};
/**
 * 3. Define instance methods
 */
interface UserMethods {
    correctPassword(this: UserDoc, candidatePassword: string, userPassword: string): Promise<boolean>;
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
 * 9. Export model
 */
declare const User: UserModel;
export { User, UserType, UserDoc, UserModel };
//# sourceMappingURL=userModel.d.ts.map