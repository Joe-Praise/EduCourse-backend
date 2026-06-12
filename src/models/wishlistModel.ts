import {
  Schema,
  model,
  HydratedDocument,
  Model,
  InferSchemaType,
  Types,
  Query,
} from 'mongoose';

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist item must belong to a user'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Wishlist item must reference a course'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

type WishlistType = InferSchemaType<typeof wishlistSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

interface WishlistMethods {}

interface WishlistStatics {
  findByUser(this: WishlistModel, userId: string): Promise<WishlistDoc[]>;
  isWishlisted(this: WishlistModel, userId: string, courseId: string): Promise<boolean>;
}

type WishlistDoc = HydratedDocument<WishlistType, WishlistMethods>;
type WishlistModel = Model<WishlistType, {}, WishlistMethods> & WishlistStatics;

wishlistSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId });
};

wishlistSchema.statics.isWishlisted = async function (userId: string, courseId: string) {
  const doc = await this.findOne({ userId, courseId });
  return !!doc;
};

/**
 * Indexes
 */
wishlistSchema.index({ userId: 1, courseId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1 });

/**
 * Middleware
 */
wishlistSchema.pre<Query<WishlistDoc[], WishlistDoc>>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate({
    path: 'courseId',
    select: 'title imageCover price priceDiscount slug ratingsAverage studentsQuantity level',
  });
  next();
});

const Wishlist = model<WishlistType, WishlistModel>('Wishlist', wishlistSchema);

export { Wishlist, WishlistType, WishlistDoc, WishlistModel };
