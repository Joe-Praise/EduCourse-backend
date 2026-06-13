import { Schema, HydratedDocument, Model, InferSchemaType, Types } from 'mongoose';
declare const wishlistSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
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
    addedAt: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    active: boolean;
    courseId: Types.ObjectId;
    userId: Types.ObjectId;
    addedAt: NativeDate;
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
    addedAt: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type WishlistType = InferSchemaType<typeof wishlistSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
interface WishlistMethods {
}
interface WishlistStatics {
    findByUser(this: WishlistModel, userId: string): Promise<WishlistDoc[]>;
    isWishlisted(this: WishlistModel, userId: string, courseId: string): Promise<boolean>;
}
type WishlistDoc = HydratedDocument<WishlistType, WishlistMethods>;
type WishlistModel = Model<WishlistType, {}, WishlistMethods> & WishlistStatics;
declare const Wishlist: WishlistModel;
export { Wishlist, WishlistType, WishlistDoc, WishlistModel };
//# sourceMappingURL=wishlistModel.d.ts.map