import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { NotificationModel } from '../models/notificationModel';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  let notifications = await NotificationModel.find({
    $or: [{ userId: req.user?._id }, { userId: { $exists: false } }],
  }).sort({ createdAt: -1 });

  // Seed default notifications if empty
  if (notifications.length === 0) {
    notifications = await NotificationModel.create([
      {
        userId: req.user?._id,
        type: 'task',
        title: 'New Task Assigned',
        message: 'You have been assigned to "Payment Gateway Integration" on FinTech Nexus.',
        timestamp: '10 mins ago',
        read: false,
        priority: 'high',
      },
      {
        userId: req.user?._id,
        type: 'milestone',
        title: 'Milestone Achieved',
        message: 'Milestone "Sprint 1 MVP Launch" has been marked as completed.',
        timestamp: '1 hour ago',
        read: false,
        priority: 'medium',
      },
      {
        userId: req.user?._id,
        type: 'ai',
        title: 'AI Intelligence Recommendation',
        message: 'DevFlow Copilot suggests rebalancing workload for Marcus Vance (92% load).',
        timestamp: '3 hours ago',
        read: true,
        priority: 'medium',
      },
    ]);
  }

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount: notifications.filter((n) => !n.read).length,
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read,
      priority: n.priority,
    })),
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const notif = await NotificationModel.findById(req.params.id);
  if (!notif) {
    throw new ApiError('Notification not found', 404);
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

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await NotificationModel.updateMany(
    { $or: [{ userId: req.user?._id }, { userId: { $exists: false } }] },
    { $set: { read: true } }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});
