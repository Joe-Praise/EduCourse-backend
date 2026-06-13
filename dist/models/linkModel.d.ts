import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
declare const linkSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    url: string;
    active: boolean;
    userId: Types.ObjectId;
    platform: "Facebook" | "X" | "Pinterest" | "Instagram" | "YouTube" | "LinkedIn" | "Website";
    displayName?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    url: string;
    active: boolean;
    userId: Types.ObjectId;
    platform: "Facebook" | "X" | "Pinterest" | "Instagram" | "YouTube" | "LinkedIn" | "Website";
    displayName?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    url: string;
    active: boolean;
    userId: Types.ObjectId;
    platform: "Facebook" | "X" | "Pinterest" | "Instagram" | "YouTube" | "LinkedIn" | "Website";
    displayName?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Infer base type from schema (no duplication!)
 */
type LinkType = InferSchemaType<typeof linkSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Instance methods
 */
interface LinkMethods {
    isValid(this: LinkDoc): boolean;
    getDomain(this: LinkDoc): string;
}
/**
 * Statics
 */
interface LinkStatics {
    findByUser(this: LinkModel, userId: string): Promise<LinkDoc[]>;
    findByPlatform(this: LinkModel, platform: string): Promise<LinkDoc[]>;
}
type LinkDoc = HydratedDocument<LinkType, LinkMethods>;
type LinkModel = Model<LinkType, {}, LinkMethods> & LinkStatics;
declare const Link: LinkModel;
export { Link, LinkType, LinkDoc, LinkModel };
//# sourceMappingURL=linkModel.d.ts.map