import type { Request, Response, NextFunction } from 'express';
import '../events/cache/notificationCache.events.js';
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        role: string[];
    };
}
export declare const getNotificationsForUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const getUnreadCount: (req: Request, res: Response, next: NextFunction) => void;
export declare const markNotificationRead: (req: Request, res: Response, next: NextFunction) => void;
export declare const markAllRead: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteNotification: (req: Request, res: Response, next: NextFunction) => void;
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
export declare const streamNotifications: (req: AuthenticatedRequest, res: Response) => void;
declare const PREF_TYPES: readonly ["enrollment", "review", "review_alert", "course_published", "earning", "progress_nudge", "system"];
type PrefType = (typeof PREF_TYPES)[number];
/**
 * Returns the auth'd user's notification preferences, upserting a default
 * document if one doesn't exist yet. Idempotent.
 */
export declare const getMyNotificationPreferences: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Updates one or more channel-pair settings + the master `enabled` switch.
 * Body shape: { enabled?, enrollment?: {inApp?, email?}, review?: {...}, ... }
 * Only known keys are written; unknown keys are dropped silently.
 */
export declare const updateMyNotificationPreferences: (req: Request, res: Response, next: NextFunction) => void;
export declare function isPreferenceType(value: string): value is PrefType;
export {};
//# sourceMappingURL=notificationController.d.ts.map