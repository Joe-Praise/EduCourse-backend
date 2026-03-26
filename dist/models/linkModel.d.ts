import { Schema, HydratedDocument, Model, InferSchemaType, Types } from "mongoose";
/**
 * 1. Define schema (single source of truth)
 */
declare const linkSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    url: string;
    platform: "Facebook" | "X" | "Pinterest" | "Instagram" | "YouTube" | "LinkedIn" | "Website";
    displayName?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    url: string;
    platform: "Facebook" | "X" | "Pinterest" | "Instagram" | "YouTube" | "LinkedIn" | "Website";
    displayName?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    active: boolean;
    userId: Types.ObjectId;
    url: string;
    platform: "Facebook" | "X" | "Pinterest" | "Instagram" | "YouTube" | "LinkedIn" | "Website";
    displayName?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * 2. Infer base type from schema (no duplication!)
 */
type LinkType = InferSchemaType<typeof linkSchema> & {
    _id: Types.ObjectId;
};
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
 * 9. Export model
 */
declare const Link: LinkModel;
export { Link, LinkType, LinkDoc, LinkModel };
//# sourceMappingURL=linkModel.d.ts.map