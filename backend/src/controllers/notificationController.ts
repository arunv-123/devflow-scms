import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { NotificationModel } from '../models/notificationModel';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Get authenticated user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError('Authentication required', 401);
  }

  // Strictly scope to authenticated user - do NOT return unowned or dummy notifications
  const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount: notifications.filter((n) => !n.read).length,
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp || n.createdAt,
      read: n.read,
      priority: n.priority,
      entityId: n.entityId,
      entityType: n.entityType,
      projectId: n.projectId,
      actionUrl: n.actionUrl,
    })),
  });
});

// @desc    Mark notification as read (User must own notification)
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError('Authentication required', 401);
  }

  const notif = await NotificationModel.findById(req.params.id);
  if (!notif) {
    throw new ApiError('Notification not found', 404);
  }

  // Security check: User can only mark THEIR OWN notification as read
  if (notif.userId.toString() !== userId.toString()) {
    throw new ApiError('Unauthorized: You can only update your own notifications', 403);
  }

  notif.read = true;
  await notif.save();

  res.status(200).json({
    success: true,
    notification: {
      id: notif._id.toString(),
      read: notif.read,
    },
  });
});

// @desc    Mark all notifications as read for authenticated user
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError('Authentication required', 401);
  }

  await NotificationModel.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// @desc    Delete single notification for authenticated user
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError('Authentication required', 401);
  }

  const notif = await NotificationModel.findById(req.params.id);
  if (!notif) {
    throw new ApiError('Notification not found', 404);
  }

  if (notif.userId.toString() !== userId.toString()) {
    throw new ApiError('Unauthorized: You can only delete your own notifications', 403);
  }

  await NotificationModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

// @desc    Clear all notifications for authenticated user
// @route   DELETE /api/notifications/clear-all
// @access  Private
export const clearAllNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError('Authentication required', 401);
  }

  await NotificationModel.deleteMany({ userId });

  res.status(200).json({
    success: true,
    message: 'All notifications cleared successfully',
  });
});
