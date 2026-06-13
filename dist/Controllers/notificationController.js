import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import Pagination from '../utils/paginationFeatures.js';
import { appEvents } from '../events/index.js';
import { CacheEvent } from '../events/cache/cache.events.js';
import { CacheKeyBuilder } from '../utils/cacheKeyBuilder.js';
import { cacheManager } from '../utils/cacheManager.js';
import { Notification } from '../models/notificationModel.js';
import { NotificationPreference } from '../models/notificationPreferenceModel.js';
// Register cache event listeners
import '../events/cache/notificationCache.events.js';
export const getNotificationsForUser = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const cacheKey = CacheKeyBuilder.listKey('notifications', { userId });
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', ...cached });
    }
    const features = new APIFeatures(Notification.find({ userId }), req.query)
        .filter()
        .sorting()
        .limitFields();
    const docs = await features.query;
    const paginated = new Pagination(req.query).paginate(docs);
    await cacheManager.set(cacheKey, paginated, 60); // short TTL — notifications change often
    res.status(200).json({ status: 'success', ...paginated });
});
export const getUnreadCount = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const cacheKey = CacheKeyBuilder.resourceKey('notifications-unread', userId);
    const cached = await cacheManager.get(cacheKey);
    if (cached !== null) {
        return res.status(200).json({ status: 'success', data: { count: cached } });
    }
    const count = await Notification.countUnreadForUser(userId);
    await cacheManager.set(cacheKey, count, 60);
    res.status(200).json({ status: 'success', data: { count } });
});
export const markNotificationRead = catchAsync(async (req, res, next) => {
    const doc = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true, runValidators: true });
    if (!doc) {
        return next(new AppError('No notification found with that ID', 404));
    }
    appEvents.emit(CacheEvent.NOTIFICATION.UPDATED, doc);
    res.status(200).json({ status: 'success', data: doc });
});
export const markAllRead = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    await Notification.markAllReadForUser(userId);
    // Invalidate caches
    const listKey = CacheKeyBuilder.listKey('notifications', { userId });
    const unreadKey = CacheKeyBuilder.resourceKey('notifications-unread', userId);
    await cacheManager.remove(listKey);
    await cacheManager.remove(unreadKey);
    res.status(200).json({ status: 'success', data: null });
});
export const deleteNotification = catchAsync(async (req, res, next) => {
    const doc = await Notification.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!doc) {
        return next(new AppError('No notification found with that ID', 404));
    }
    appEvents.emit(CacheEvent.NOTIFICATION.DELETED, doc._id.toString());
    res.status(204).json({ status: 'success', data: null });
});
/**
 * SSE stream of new notifications for the authenticated user.
 *
 * Connection lives until the client disconnects. We listen on the
 * `NOTIFICATION.CREATED` app event and forward any payload whose `userId`
 * matches the auth'd user. A heartbeat comment every 25s keeps proxies
 * (nginx, cloudflare) from idle-closing the connection.
 *
 * Client: `new EventSource('/api/v1/notifications/stream', { withCredentials: true })`.
 * Auth flows via the JWT cookie since EventSource can't set custom headers.
 */
export const streamNotifications = (req, res) => {
    const userId = req.user._id.toString();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if proxied
    res.flushHeaders?.();
    res.write(`: connected ${new Date().toISOString()}\n\n`);
    const send = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    const listener = (notification) => {
        const targetId = typeof notification.userId === 'string'
            ? notification.userId
            : notification.userId?.toString();
        if (targetId === userId) {
            send({ type: 'notification.created', data: notification });
        }
    };
    appEvents.on(CacheEvent.NOTIFICATION.CREATED, listener);
    const heartbeat = setInterval(() => {
        res.write(`: ping ${Date.now()}\n\n`);
    }, 25000);
    req.on('close', () => {
        clearInterval(heartbeat);
        appEvents.off(CacheEvent.NOTIFICATION.CREATED, listener);
        res.end();
    });
};
// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------
const PREF_TYPES = [
    'enrollment',
    'review',
    'review_alert',
    'course_published',
    'earning',
    'progress_nudge',
    'system',
];
/**
 * Returns the auth'd user's notification preferences, upserting a default
 * document if one doesn't exist yet. Idempotent.
 */
export const getMyNotificationPreferences = catchAsync(async (req, res, _next) => {
    const userId = req.user._id;
    const prefs = await NotificationPreference.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.status(200).json({ status: 'success', data: prefs });
});
/**
 * Updates one or more channel-pair settings + the master `enabled` switch.
 * Body shape: { enabled?, enrollment?: {inApp?, email?}, review?: {...}, ... }
 * Only known keys are written; unknown keys are dropped silently.
 */
export const updateMyNotificationPreferences = catchAsync(async (req, res, _next) => {
    const userId = req.user._id;
    const body = (req.body ?? {});
    const update = {};
    if (typeof body.enabled === 'boolean')
        update.enabled = body.enabled;
    for (const type of PREF_TYPES) {
        const channel = body[type];
        if (channel && typeof channel === 'object') {
            if (typeof channel.inApp === 'boolean')
                update[`${type}.inApp`] = channel.inApp;
            if (typeof channel.email === 'boolean')
                update[`${type}.email`] = channel.email;
        }
    }
    const prefs = await NotificationPreference.findOneAndUpdate({ userId }, { $set: update, $setOnInsert: { userId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.status(200).json({ status: 'success', data: prefs });
});
// Helper: narrow the type to PREF_TYPES at runtime. Exported for use by the
// publishing layer if it ever needs to check `shouldDeliver(userId, type, channel)`.
export function isPreferenceType(value) {
    return PREF_TYPES.includes(value);
}
//# sourceMappingURL=notificationController.js.map