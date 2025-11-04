import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for current user
// GET /api/notifications?limit=50&offset=0
router.get("/", getNotifications);

// Get unread count
// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
// PUT /api/notifications/:notificationId/read
router.put("/:notificationId/read", markNotificationAsRead);

// Mark all notifications as read
// PUT /api/notifications/read-all
router.put("/read-all", markAllNotificationsAsRead);

// Delete a notification
// DELETE /api/notifications/:notificationId
router.delete("/:notificationId", deleteNotification);

export default router;

