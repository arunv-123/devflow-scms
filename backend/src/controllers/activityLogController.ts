import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ActivityLogModel } from '../models/activityLogModel';
import { asyncHandler } from '../utils/errors';

// @desc    Get system activity logs with optional filtering
// @route   GET /api/activity-logs
// @access  Private
export const getActivityLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, action, userName, search } = req.query;

  let count = await ActivityLogModel.countDocuments();

  // Seed sample logs if database is empty
  if (count === 0) {
    await ActivityLogModel.create([
      {
        userName: 'Marcus Vance',
        userRole: 'Team Lead',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        action: 'Task Status Updated',
        entity: 'Implement OAuth2 & Multi-Factor Auth JWT Pipeline',
        projectName: 'Apex Enterprise Portal & Mobile App',
        timestamp: '15 mins ago',
        description: 'Moved task status from Todo to In Progress and completed 2 subtasks.',
      },
      {
        userName: 'Alex Morgan',
        userRole: 'Super Admin',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        action: 'Tech Stack Updated',
        entity: 'Apex Enterprise Portal & Mobile App',
        projectName: 'Apex Enterprise Portal & Mobile App',
        timestamp: '1 hour ago',
        description: 'Tech stack updated for "Apex Enterprise Portal & Mobile App": Added Redis, Tailwind',
        metadata: {
          previousTechStack: ['Next.js', 'TypeScript', 'Node.js', 'MongoDB'],
          newTechStack: ['Next.js', 'TypeScript', 'Node.js', 'MongoDB', 'Redis', 'Tailwind'],
          additions: ['Redis', 'Tailwind'],
          removals: [],
          reason: 'AI recommendation approved by Project Lead',
        },
      },
      {
        userName: 'Priya Patel',
        userRole: 'QA',
        userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        action: 'Document Uploaded',
        entity: 'E2E_Test_Plan_and_QA_Automated_Suite.docx',
        projectName: 'Apex Enterprise Portal & Mobile App',
        timestamp: '3 hours ago',
        description: 'Uploaded automated QA test plan document for Apex Portal.',
      },
      {
        userName: 'Sarah Chen',
        userRole: 'Project Manager',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        action: 'Milestone Created',
        entity: 'Backend API, Authentication & Integration',
        projectName: 'Apex Enterprise Portal & Mobile App',
        timestamp: '1 day ago',
        description: 'Created milestone Backend API, Authentication & Integration for Apex Enterprise Portal.',
      },
    ]);
  }

  // Build MongoDB query filter
  const query: any = {};

  if (projectId) {
    query.$or = [{ projectId: projectId.toString() }, { entityId: projectId.toString() }];
  }

  if (action && action !== 'ALL') {
    query.action = { $regex: action.toString(), $options: 'i' };
  }

  if (userName && userName !== 'ALL') {
    query.userName = { $regex: userName.toString(), $options: 'i' };
  }

  if (search) {
    const searchRegex = { $regex: search.toString(), $options: 'i' };
    query.$or = [
      ...(query.$or || []),
      { description: searchRegex },
      { entity: searchRegex },
      { userName: searchRegex },
      { projectName: searchRegex },
    ];
  }

  const logs = await ActivityLogModel.find(query).sort({ createdAt: -1 }).limit(100);

  res.status(200).json({
    success: true,
    count: logs.length,
    logs: logs.map((log) => ({
      id: log._id.toString(),
      userName: log.userName,
      userRole: log.userRole || 'Team Member',
      userId: log.userId,
      userAvatar: log.userAvatar,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      projectId: log.projectId,
      projectName: log.projectName,
      timestamp: log.timestamp || log.createdAt?.toISOString()?.split('T')[0] || 'Just now',
      description: log.description,
      metadata: log.metadata,
      createdAt: log.createdAt,
    })),
  });
});
