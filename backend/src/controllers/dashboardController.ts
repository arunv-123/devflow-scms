import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { User } from '../models/userModel';
import { Client } from '../models/clientModel';
import { Milestone } from '../models/milestoneModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { asyncHandler } from '../utils/errors';

// @desc    Get executive dashboard metrics & aggregated overview
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const [projects, tasks, users, clients, milestones, activityLogs] = await Promise.all([
    Project.find().sort({ createdAt: -1 }),
    Task.find().populate('assignee'),
    User.find({ role: { $ne: 'Client' } }),
    Client.find(),
    Milestone.find().sort({ dueDate: 1 }).limit(5),
    ActivityLogModel.find().sort({ createdAt: -1 }).limit(6),
  ]);

  const activeProjects = projects.filter((p: any) => p.status === 'In Progress');
  const completedProjects = projects.filter((p: any) => p.status === 'Completed');
  const pendingTasks = tasks.filter((t: any) => t.status !== 'Completed');
  const completedTasks = tasks.filter((t: any) => t.status === 'Completed');
  const overdueTasks = tasks.filter(
    (t: any) => t.status !== 'Completed' && new Date(t.dueDate) < new Date()
  );

  const totalHealth = projects.reduce((acc: number, p: any) => acc + (p.healthScore || 85), 0);
  const overallHealth = projects.length > 0 ? Math.round(totalHealth / projects.length) : 87;

  const totalWorkload = users.reduce((acc: number, u: any) => acc + (u.workloadPercent || 0), 0);
  const avgCapacity = users.length > 0 ? Math.round(totalWorkload / users.length) : 75;

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalProjects: projects.length,
        activeProjectsCount: activeProjects.length,
        completedProjectsCount: completedProjects.length,
        totalTasks: tasks.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        overdueTasksCount: overdueTasks.length,
        totalClientsCount: clients.length,
        totalTeamMembersCount: users.length,
        overallHealth,
        avgCapacity,
      },
      activeProjects: projects.slice(0, 5).map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        clientName: p.clientName,
        status: p.status,
        description: p.description,
        budget: p.budget,
        progress: p.progress,
        healthScore: p.healthScore || 85,
      })),
      upcomingMilestones: milestones.map((m: any) => ({
        id: m._id.toString(),
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        status: m.status,
        progress: m.progress,
        owner: m.owner ? { name: (m.owner as any).name || 'Team Lead' } : { name: 'Team Lead' },
      })),
      recentActivity: activityLogs.map((log: any) => ({
        id: log._id.toString(),
        userName: log.userName,
        userAvatar: log.userAvatar,
        action: log.action,
        entity: log.entity,
        timestamp: log.timestamp,
        description: log.description,
      })),
    },
  });
});
