import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const enrollmentSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    enrolledAt: NativeDate;
    paymentRef?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    enrolledAt: NativeDate;
    paymentRef?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    enrolledAt: NativeDate;
    paymentRef?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type EnrollmentType = InferSchemaType<typeof enrollmentSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
interface EnrollmentMethods {
}
interface EnrollmentStatics {
    findByCourse(this: EnrollmentModel, courseId: string): Promise<EnrollmentDoc[]>;
    findByUser(this: EnrollmentModel, userId: string): Promise<EnrollmentDoc[]>;
    countByCourse(this: EnrollmentModel, courseId: string): Promise<number>;
}
type EnrollmentDoc = HydratedDocument<EnrollmentType, EnrollmentMethods>;
type EnrollmentModel = Model<EnrollmentType, {}, EnrollmentMethods> & EnrollmentStatics;
declare const Enrollment: EnrollmentModel;
export { Enrollment, EnrollmentType, EnrollmentDoc, EnrollmentModel };
//# sourceMappingURL=enrollmentModel.d.ts.map