import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query
} from "mongoose";

const tagSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A tag must have name!'],
      unique: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true },
);

/**
 * Infer base type from schema (no duplication!)
 */
type TagType = InferSchemaType<typeof tagSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Instance methods
 */
interface TagMethods {
  getSlug(this: TagDoc): string;
}

/**
 * Statics
 */
interface TagStatics {
  findByName(this: TagModel, name: string): Promise<TagDoc | null>;
  findOrCreate(this: TagModel, name: string): Promise<TagDoc>;
}

type TagDoc = HydratedDocument<TagType, TagMethods>;
type TagModel = Model<TagType, {}, TagMethods> & TagStatics;

/**
 * Methods
 */
tagSchema.methods.getSlug = function (this: TagDoc) {
  return this.name.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Statics
 */
tagSchema.statics.findByName = function (name: string) {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') });
};

tagSchema.statics.findOrCreate = async function (name: string) {
  let tag = await (this as TagModel).findByName(name);
  if (!tag) {
    tag = await this.create({ name });
  }
  return tag;
};

/**
 * Virtuals
 */
tagSchema.virtual('blogs', {
  ref: 'Blog',
  foreignField: 'tag',
  localField: '_id',
});

/**
 * Middleware
 */
tagSchema.pre<Query<TagDoc[], TagDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Tag = model<TagType, TagModel>("Tag", tagSchema);

export { Tag, TagType, TagDoc, TagModel };
