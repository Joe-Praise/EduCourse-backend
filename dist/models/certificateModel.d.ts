import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const certificateSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: {
        prototype?: Types.ObjectId;
        generate?: {};
        isValid?: {};
        cacheHexString?: unknown;
        createFromTime?: {};
        createFromHexString?: {};
        createFromBase64?: {};
    };
    userId: {
        prototype?: Types.ObjectId;
        generate?: {};
        isValid?: {};
        cacheHexString?: unknown;
        createFromTime?: {};
        createFromHexString?: {};
        createFromBase64?: {};
    };
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: {
        prototype?: Types.ObjectId;
        generate?: {};
        isValid?: {};
        cacheHexString?: unknown;
        createFromTime?: {};
        createFromHexString?: {};
        createFromBase64?: {};
    };
    userId: {
        prototype?: Types.ObjectId;
        generate?: {};
        isValid?: {};
        cacheHexString?: unknown;
        createFromTime?: {};
        createFromHexString?: {};
        createFromBase64?: {};
    };
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: {
        prototype?: Types.ObjectId;
        generate?: {};
        isValid?: {};
        cacheHexString?: unknown;
        createFromTime?: {};
        createFromHexString?: {};
        createFromBase64?: {};
    };
    userId: {
        prototype?: Types.ObjectId;
        generate?: {};
        isValid?: {};
        cacheHexString?: unknown;
        createFromTime?: {};
        createFromHexString?: {};
        createFromBase64?: {};
    };
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type CertificateType = InferSchemaType<typeof certificateSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
interface CertificateMethods {
    getLabel(this: CertificateDoc): string;
}
interface CertificateStatics {
    findForUser(this: CertificateModel, userId: string): Promise<CertificateDoc[]>;
}
type CertificateDoc = HydratedDocument<CertificateType, CertificateMethods>;
type CertificateModel = Model<CertificateType, {}, CertificateMethods> & CertificateStatics;
declare const Certificate: CertificateModel;
export { Certificate, CertificateType, CertificateDoc, CertificateModel };
//# sourceMappingURL=certificateModel.d.ts.map