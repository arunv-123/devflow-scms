import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ActivityLogModel } from '../models/activityLogModel';
import { asyncHandler } from '../utils/errors';

// @desc    Get system activity logs
// @route   GET /api/activity-logs
// @access  Private
export const getActivityLogs = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  let logs = await ActivityLogModel.find().sort({ createdAt: -1 }).limit(50);

  // Seed sample logs if database is empty
  if (logs.length === 0) {
    logs = await ActivityLogModel.create([
      {
        userName: 'Alex Chen',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        action: 'Task Completed',
        entity: 'Payment API Integration',
        timestamp: '15 mins ago',
        description: 'Marked Payment API Integration task as Completed for FinTech Nexus',
      },
      {
        userName: 'Elena Rostova',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        action: 'Document Uploaded',
        entity: 'UI Architecture Specification',
        timestamp: '1 hour ago',
        description: 'Uploaded UI Architecture Specification document',
      },
      {
        userName: 'Marcus Vance',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        action: 'Milestone Created',
        entity: 'Sprint 2 Beta Release',
        timestamp: '3 hours ago',
        description: 'Added new milestone Sprint 2 Beta Release for HealthPulse Platform',
      },
    ]);
  }

  res.status(200).json({
    success: true,
    count: logs.length,
    logs: logs.map((log) => ({
      id: log._id.toString(),
      userName: log.userName,
      userAvatar: log.userAvatar,
      action: log.action,
      entity: log.entity,
      timestamp: log.timestamp,
      description: log.description,
    })),
  });
});
