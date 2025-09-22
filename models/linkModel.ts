import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types
} from "mongoose";

/**
 * 1. Define schema (single source of truth)
 */
const linkSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Link must belong to a user!'],
  },
  platform: {
    type: String,
    enum: {
      values: ['Facebook', 'X', 'Pinterest', 'Instagram', 'YouTube', 'LinkedIn', 'Website'],
      message:
        'platform should be between Facebook, X, Pinterest, Instagram, YouTube, LinkedIn, Website',
    },
    required: [true, 'Link requires a specified platform'],
  },
  url: {
    type: String,
    required: [true, 'Please provide a url to your profile!'],
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP or HTTPS URL'
    }
  },
  displayName: {
    type: String,
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
type LinkType = InferSchemaType<typeof linkSchema> & { _id: Types.ObjectId }

/**
 * 3. Define instance methods
 */
interface LinkMethods {
  isValid(this: LinkDoc): boolean;
  getDomain(this: LinkDoc): string;
}

/**
 * 4. Define statics
 */
interface LinkStatics {
  findByUser(this: LinkModel, userId: string): Promise<LinkDoc[]>;
  findByPlatform(this: LinkModel, platform: string): Promise<LinkDoc[]>;
}

/**
 * 5. Combine into document & model types
 */
type LinkDoc = HydratedDocument<LinkType, LinkMethods>;
type LinkModel = Model<LinkType, {}, LinkMethods> & LinkStatics;

/**
 * 6. Add methods
 */
linkSchema.methods.isValid = function (this: LinkDoc) {
  return /^https?:\/\/.+/.test(this.url);
};

linkSchema.methods.getDomain = function (this: LinkDoc) {
  try {
    return new URL(this.url).hostname;
  } catch {
    return '';
  }
};

/**
 * 7. Add statics
 */
linkSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId });
};

linkSchema.statics.findByPlatform = function (platform: string) {
  return this.find({ platform });
};

/**
 * 8. Add indexes
 */
linkSchema.index({ userId: 1, platform: 1 }, { unique: true });
linkSchema.index({ platform: 1 });

/**
 * 9. Export model
 */
const Link = model<LinkType, LinkModel>("Link", linkSchema);

export { Link, LinkType, LinkDoc, LinkModel };
