import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

/**
 * 1. Define schema (single source of truth)
 */
const instructorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor must be a user'],
    },
    title: {
      type: String,
      required: [true, 'Instructor must have a title'],
    },
    description: {
      type: String,
      required: [true, 'Instructor should have a description'],
      default: 'I am an instructor, i have my course coming soon',
    },
    links: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Link' 
    }],
    expertise: {
      type: String,
      required: [true, 'Instructor expertise is required!'],
    },
    active: { 
      type: Boolean, 
      default: true, 
      select: false 
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * 2. Infer base type from schema (no duplication!)
 */
type InstructorType = InferSchemaType<typeof instructorSchema> & { _id: Types.ObjectId }

/**
 * 3. Define instance methods
 */
interface InstructorMethods {
  getFullProfile(this: InstructorDoc): Promise<InstructorDoc>;
  addLink(this: InstructorDoc, linkId: string): Promise<InstructorDoc>;
  removeLink(this: InstructorDoc, linkId: string): Promise<InstructorDoc>;
}

/**
 * 4. Define statics (optional)
 */
interface InstructorStatics {
  findByUser(this: InstructorModel, userId: string): Promise<InstructorDoc | null>;
  findByExpertise(this: InstructorModel, expertise: string): Promise<InstructorDoc[]>;
}

/**
 * 5. Combine into document & model types
 */
type InstructorDoc = HydratedDocument<InstructorType, InstructorMethods>;
type InstructorModel = Model<InstructorType, {}, InstructorMethods> & InstructorStatics;

/**
 * 6. Add methods
 */
instructorSchema.methods.getFullProfile = async function (this: InstructorDoc) {
  return await this.populate(['userId', 'links']);
};

instructorSchema.methods.addLink = async function (this: InstructorDoc, linkId: string) {
  if (!this.links.includes(linkId as any)) {
    this.links.push(linkId as any);
    return await this.save();
  }
  return this;
};

instructorSchema.methods.removeLink = async function (this: InstructorDoc, linkId: string) {
  this.links = this.links.filter(link => link.toString() !== linkId);
  return await this.save();
};

/**
 * 7. Add statics
 */
instructorSchema.statics.findByUser = function (userId: string) {
  return this.findOne({ userId });
};

instructorSchema.statics.findByExpertise = function (expertise: string) {
  return this.find({ expertise: new RegExp(expertise, 'i') });
};

/**
 * 8. Add indexes
 */
instructorSchema.index({ userId: 1 }, { unique: true });
instructorSchema.index({ expertise: 1 });

/**
 * 9. Add virtuals
 */
instructorSchema.virtual('courses', {
  ref: 'Course',
  foreignField: 'instructors',
  localField: '_id',
});

/**
 * 10. Middleware (typed this)
 */
instructorSchema.pre<Query<InstructorDoc[], InstructorDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({
    path: 'userId',
    select: '-__v -passwordChangedAt -password',
  });

  this.populate({
    path: 'links',
    select: '-__v -userId',
  });

  next();
});

/**
 * 11. Export model
 */
const Instructor = model<InstructorType, InstructorModel>("Instructor", instructorSchema);

export { Instructor, InstructorType, InstructorDoc, InstructorModel };
