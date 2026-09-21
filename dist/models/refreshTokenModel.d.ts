import { Schema, HydratedDocument, Model, InferSchemaType, Types, Query } from 'mongoose';
/**
 * Server-stored refresh token. The raw token is sent to the client (in an
 * httpOnly cookie) but only its SHA-256 hash is persisted, so a DB read
 * cannot recover live tokens.
 *
 * Lifecycle:
 *   1. Login → server issues access JWT (~15m) + refresh token (~7d)
 *   2. Client uses access token until 401
 *   3. On 401, client POSTs /users/refresh → server rotates: revoke the
 *      submitted refresh, issue a new pair.
 *   4. Logout → revoke the refresh token by id.
 *
 * Rotation + revocation give us per-device session control: if a refresh
 * token is stolen, the legitimate next-use detection (revoked == true on
 * the next /refresh attempt) lets us nuke all of a user's sessions.
 */
declare const refreshTokenSchema: Schema<any, Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: NativeDate;
    revoked: boolean;
    userAgent?: string;
    ip?: string;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: NativeDate;
    revoked: boolean;
    userAgent?: string;
    ip?: string;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: NativeDate;
    revoked: boolean;
    userAgent?: string;
    ip?: string;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
type RefreshTokenType = InferSchemaType<typeof refreshTokenSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};
type RefreshTokenDoc = HydratedDocument<RefreshTokenType>;
interface RefreshTokenStatics {
    hashToken(this: RefreshTokenModel, raw: string): string;
    generateRaw(this: RefreshTokenModel): string;
    revokeAllForUser(this: RefreshTokenModel, userId: string): Promise<void>;
}
type RefreshTokenModel = Model<RefreshTokenType> & RefreshTokenStatics;
declare const RefreshToken: RefreshTokenModel;
export { RefreshToken, RefreshTokenType, RefreshTokenDoc, RefreshTokenModel };
export type RefreshTokenQuery = Query<RefreshTokenDoc[], RefreshTokenDoc>;
//# sourceMappingURL=refreshTokenModel.d.ts.map