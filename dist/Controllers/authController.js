import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { RefreshToken } from '../models/refreshTokenModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';
const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '7', 10);
const REFRESH_COOKIE_NAME = 'rt';
// Enterprise utility functions
const signToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL,
    });
};
const isProd = () => process.env.NODE_ENV === 'production';
const accessCookieOptions = () => ({
    // Access token cookie matches the JWT TTL so old browsers don't sit on a
    // valid cookie after the JWT itself has expired. The real expiry comes
    // from the JWT's own `exp` claim — this is just convenience.
    httpOnly: true,
    secure: isProd(),
    sameSite: (isProd() ? 'none' : 'lax'),
    // No explicit `expires` → session cookie that dies on browser close.
});
const refreshCookieOptions = () => ({
    expires: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd(),
    sameSite: (isProd() ? 'none' : 'lax'),
    // Scope: only sent to /users/* routes (refresh + logout). Reduces the
    // surface area if any other endpoint ever logs the request body.
    path: '/api/v1/users',
});
/**
 * Options for clearing the refresh cookie. MUST match the path/security attrs
 * the cookie was set with, but must NOT include `expires` — Express v5 ignores
 * (and deprecation-warns on) `expires` in clearCookie since it expires the
 * cookie immediately on its own.
 */
const refreshClearOptions = () => ({
    httpOnly: true,
    secure: isProd(),
    sameSite: (isProd() ? 'none' : 'lax'),
    path: '/api/v1/users',
});
/**
 * Persists a new refresh token (hashed) and returns the RAW token for the
 * cookie. Called on every login / refresh / signup.
 */
const issueRefreshToken = async (userId, req) => {
    const raw = RefreshToken.generateRaw();
    const tokenHash = RefreshToken.hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
        userId,
        tokenHash,
        expiresAt,
        userAgent: req.get('user-agent') ?? undefined,
        ip: req.ip,
    });
    return raw;
};
const createSendToken = async (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const refreshRaw = await issueRefreshToken(user._id.toString(), req);
    res.cookie('jwt', token, accessCookieOptions());
    res.cookie(REFRESH_COOKIE_NAME, refreshRaw, refreshCookieOptions());
    // Seed the express-session so the session-first branch of `protect` works
    // on the very next request — keeps users signed in across reloads.
    req.session.user = {
        id: user._id.toString(),
        role: user.role,
        username: user.name,
    };
    // Remove sensitive data from output
    const sanitizedUser = { ...user.toObject() };
    delete sanitizedUser.password;
    delete sanitizedUser.confirmPassword;
    delete sanitizedUser.passwordResetToken;
    delete sanitizedUser.passwordResetExpires;
    res.status(statusCode).json({
        status: 'success',
        token,
        // expiresIn lets the client schedule a proactive refresh just before
        // the access token actually expires — avoids a 401 round-trip.
        expiresIn: ACCESS_TOKEN_TTL,
        data: {
            user: sanitizedUser,
        },
    });
};
export const signup = catchAsync(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    // Input validation
    if (!name || !email || !password || !confirmPassword) {
        return next(new AppError('All fields are required', 400));
    }
    if (password !== confirmPassword) {
        return next(new AppError('Passwords do not match', 400));
    }
    try {
        await User.create({
            name,
            email,
            password,
            confirmPassword,
        });
        res.status(201).json({
            status: 'success',
            message: 'User created successfully!',
        });
    }
    catch (error) {
        // Handle duplicate email error
        if (error.code === 11000) {
            return next(new AppError('Email already exists', 409));
        }
        return next(error);
    }
});
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // 1) Input validation
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3) If everything ok, send token to client
    await createSendToken(user, 200, req, res);
});
export const updatePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    // Input validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new AppError('All password fields are required', 400));
    }
    if (newPassword !== confirmPassword) {
        return next(new AppError('New passwords do not match', 400));
    }
    if (!req.user) {
        return next(new AppError('Authentication required', 401));
    }
    // 1) Get the user from the collection
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    // 2) Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }
    // 3) Update password
    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    await user.save();
    // 4) Log user in with new token
    await createSendToken(user, 200, req, res);
});
export const checkToken = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Authentication required', 401));
    }
    await createSendToken(req.user, 200, req, res);
});
export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Please provide your email address', 400));
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    // Neutral response prevents email enumeration
    const neutralResponse = {
        status: 'success',
        message: 'If an account with that email exists, a reset link has been sent.',
    };
    if (!user) {
        res.status(200).json(neutralResponse);
        return;
    }
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password/${rawToken}`;
    try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
        res.status(200).json(neutralResponse);
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the email. Try again later.', 500));
    }
});
export const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!token) {
        return next(new AppError('Reset token is missing', 400));
    }
    if (!password || !confirmPassword) {
        return next(new AppError('Please provide password and confirmPassword', 400));
    }
    if (password !== confirmPassword) {
        return next(new AppError('Passwords do not match', 400));
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    });
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();
    await createSendToken(user, 200, req, res);
});
// Export types for use in other modules
/**
 * POST /api/v1/users/refresh
 * Body-less. Reads the `rt` httpOnly cookie, validates + rotates the refresh
 * token, returns a fresh access JWT + sets a new refresh cookie.
 *
 * Rotation: every successful refresh REVOKES the submitted token and issues a
 * brand-new one. If a revoked token is later submitted, we treat the session
 * as compromised and revoke ALL refresh tokens for the user.
 */
export const refreshAccessToken = catchAsync(async (req, res, next) => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!raw) {
        return next(new AppError('Refresh token missing', 401));
    }
    const tokenHash = RefreshToken.hashToken(raw);
    const doc = await RefreshToken.findOne({ tokenHash });
    if (!doc) {
        // Token doesn't exist (or was already deleted) — definite tampering.
        return next(new AppError('Invalid refresh token', 401));
    }
    if (doc.revoked) {
        // Reuse of a revoked token = likely theft of a copy. Nuke all
        // sessions for this user to be safe.
        logger.warn(`[auth] reuse of revoked refresh token for user ${doc.userId} — revoking all sessions`);
        await RefreshToken.revokeAllForUser(doc.userId.toString());
        res.clearCookie(REFRESH_COOKIE_NAME, refreshClearOptions());
        res.clearCookie('jwt', accessCookieOptions());
        return next(new AppError('Refresh token reused — session terminated', 401));
    }
    if (doc.expiresAt.getTime() <= Date.now()) {
        return next(new AppError('Refresh token expired', 401));
    }
    const user = await User.findById(doc.userId);
    if (!user) {
        return next(new AppError('User no longer exists', 401));
    }
    // Rotate: mark the old token revoked, issue a fresh pair.
    doc.revoked = true;
    await doc.save();
    await createSendToken(user, 200, req, res);
});
/**
 * POST /api/v1/users/logout
 * Revokes the submitted refresh token (if any) and clears both cookies.
 * Idempotent — safe to call multiple times.
 */
export const logout = catchAsync(async (req, res, _next) => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (raw) {
        const tokenHash = RefreshToken.hashToken(raw);
        await RefreshToken.updateOne({ tokenHash }, { revoked: true });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshClearOptions());
    res.clearCookie('jwt', accessCookieOptions());
    // Drop the express-session too — keeps `protect`'s session-first branch
    // from resurrecting the user on the next request.
    req.session?.destroy?.(() => undefined);
    res.status(200).json({ status: 'success' });
});
//# sourceMappingURL=authController.js.map