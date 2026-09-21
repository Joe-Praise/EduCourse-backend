import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const instructorEarningSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    status: "pending" | "paid" | "refunded";
    instructorId: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    amount: number;
    platformFee: number;
    netEarning: number;
    currency: string;
    paidAt?: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    status: "pending" | "paid" | "refunded";
    instructorId: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    amount: number;
    platformFee: number;
    netEarning: number;
    currency: string;
    paidAt?: NativeDate;
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
    status: "pending" | "paid" | "refunded";
    instructorId: Types.ObjectId;
    enrollmentId: Types.ObjectId;
    amount: number;
    platformFee: number;
    netEarning: number;
    currency: string;
    paidAt?: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type InstructorEarningType = InferSchemaType<typeof instructorEarningSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
interface InstructorEarningMethods {
}
interface InstructorEarningStatics {
    totalEarningsByInstructor(this: InstructorEarningModel, instructorId: string): Promise<number>;
    earningsByPeriod(this: InstructorEarningModel, instructorId: string, startDate: Date, endDate: Date): Promise<{
        month: string;
        total: number;
    }[]>;
}
type InstructorEarningDoc = HydratedDocument<InstructorEarningType, InstructorEarningMethods>;
type InstructorEarningModel = Model<InstructorEarningType, {}, InstructorEarningMethods> & InstructorEarningStatics;
declare const InstructorEarning: InstructorEarningModel;
export { InstructorEarning, InstructorEarningType, InstructorEarningDoc, InstructorEarningModel };
//# sourceMappingURL=instructorEarningModel.d.ts.map