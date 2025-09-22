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
const tagSchema = new Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 2. Infer base type from schema (no duplication!)
 */
type TagType = InferSchemaType<typeof tagSchema> & { _id: Types.ObjectId }

/**
 * 3. Define instance methods
 */
interface TagMethods {
  getSlug(this: TagDoc): string;
}

/**
 * 4. Define statics
 */
interface TagStatics {
  findByName(this: TagModel, name: string): Promise<TagDoc | null>;
  findOrCreate(this: TagModel, name: string): Promise<TagDoc>;
}

/**
 * 5. Combine into document & model types
 */
type TagDoc = HydratedDocument<TagType, TagMethods>;
type TagModel = Model<TagType, {}, TagMethods> & TagStatics;

/**
 * 6. Add methods
 */
tagSchema.methods.getSlug = function (this: TagDoc) {
  return this.name.toLowerCase().replace(/\s+/g, '-');
};

/**
 * 7. Add statics
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
 * 8. Add indexes
 */
tagSchema.index({ name: 1 });

/**
 * 9. Add virtuals
 */
tagSchema.virtual('blogs', {
  ref: 'Blog',
  foreignField: 'tag',
  localField: '_id',
});

/**
 * 10. Middleware (typed this)
 */
tagSchema.pre<Query<TagDoc[], TagDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

/**
 * 11. Export model
 */
const Tag = model<TagType, TagModel>("Tag", tagSchema);

export { Tag, TagType, TagDoc, TagModel };
