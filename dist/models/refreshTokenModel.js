import { Schema, model, } from 'mongoose';
import crypto from 'crypto';
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
const refreshTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    /** SHA-256 hex digest of the raw token. Never the raw token itself. */
    tokenHash: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    /** Set true on /refresh (rotation) or /logout. A revoked token's use is
     *  treated as compromised and triggers `revokeAllForUser`. */
    revoked: {
        type: Boolean,
        default: false,
    },
    /** Optional metadata for the My Sessions page (future). */
    userAgent: { type: String },
    ip: { type: String },
}, { timestamps: true });
// TTL index — Mongo auto-deletes expired tokens within ~60s of `expiresAt`.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.statics.hashToken = function (raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
};
refreshTokenSchema.statics.generateRaw = function () {
    return crypto.randomBytes(48).toString('hex');
};
refreshTokenSchema.statics.revokeAllForUser = async function (userId) {
    await this.updateMany({ userId, revoked: false }, { revoked: true });
};
// Optional: filter out revoked tokens in `find` queries by default. We DON'T
// add this hook because the rotation flow needs to read revoked rows to
// detect replay/compromise.
const RefreshToken = model('RefreshToken', refreshTokenSchema);
export { RefreshToken };
//# sourceMappingURL=refreshTokenModel.js.map