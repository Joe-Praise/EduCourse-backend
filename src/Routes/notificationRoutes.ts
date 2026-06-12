import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { strictXssSanitizer } from '../middlewares/strictXssSanitizer.js';
import {
  getNotificationsForUser,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  streamNotifications,
  getMyNotificationPreferences,
  updateMyNotificationPreferences,
} from '../Controllers/notificationController.js';

const router = express.Router();
router.use(strictXssSanitizer);

router.use(protect);

router.route('/').get(getNotificationsForUser);

router.route('/unread-count').get(getUnreadCount);

router.route('/mark-all-read').patch(markAllRead);

// SSE stream — must precede `/:id` so "stream" isn't matched as a notification id.
router.get('/stream', streamNotifications);

// Preferences — also literal paths that must precede `/:id`.
router
  .route('/preferences')
  .get(getMyNotificationPreferences)
  .patch(updateMyNotificationPreferences);

router.route('/:id').patch(markNotificationRead).delete(deleteNotification);

export default router;
