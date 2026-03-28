import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from "mongoose";

const certificateSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "A certificate must belong to a user"],
    },
    courseId: {
      type: Types.ObjectId,
      ref: "Course",
      required: [true, "A certificate must belong to a course"],
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true },
);

// One certificate per user per course
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

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

certificateSchema.methods.getLabel = function (this: CertificateDoc) {
  return `Certificate-${this._id}`;
};

certificateSchema.statics.findForUser = function (userId: string) {
  return this.find({ userId });
};

certificateSchema.pre<Query<CertificateDoc[], CertificateDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Certificate = model<CertificateType, CertificateModel>("Certificate", certificateSchema);

export { Certificate, CertificateType, CertificateDoc, CertificateModel };
