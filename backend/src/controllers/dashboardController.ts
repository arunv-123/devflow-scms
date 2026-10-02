import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { User } from '../models/userModel';
import { Client } from '../models/clientModel';
import { Milestone } from '../models/milestoneModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Get dashboard metrics & aggregated overview
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const role = user.role;

  if (role === 'Client') {
    throw new ApiError("Role 'Client' is not authorised to access the dashboard.", 403);
  }

  const [projects, tasks, users, clients, milestones, activityLogs] = await Promise.all([
    Project.find().sort({ createdAt: -1 }),
    Task.find(),
    User.find({ role: { $ne: 'Client' } }),
    Client.find(),
    Milestone.find().sort({ dueDate: 1 }),
    ActivityLogModel.find().sort({ createdAt: -1 }),
  ]);

  const isExecutive = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(role);

  if (isExecutive) {
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
        upcomingMilestones: milestones.slice(0, 5).map((m: any) => ({
          id: m._id.toString(),
          title: m.title,
          description: m.description,
          dueDate: m.dueDate,
          status: m.status,
          progress: m.progress,
          owner: m.owner ? { name: (m.owner as any).name || 'Team Lead' } : { name: 'Team Lead' },
        })),
        recentActivity: activityLogs.slice(0, 6).map((log: any) => ({
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
    return;
  }

  // Contributor view: Developer, Designer, QA
  const userIdStr = user._id.toString();

  // Tasks assigned to this contributor
  const userTasks = tasks.filter((t: any) => {
    if (!t.assignee) return false;
    return (
      (t.assignee.id && t.assignee.id.toString() === userIdStr) ||
      (t.assignee.email && t.assignee.email === user.email) ||
      (t.assignee._id && t.assignee._id.toString() === userIdStr)
    );
  });

  const pendingTasks = userTasks.filter((t: any) => t.status !== 'Completed');
  const completedTasks = userTasks.filter((t: any) => t.status === 'Completed');
  const overdueTasks = userTasks.filter(
    (t: any) => t.status !== 'Completed' && new Date(t.dueDate) < new Date()
  );

  // Projects relevant to this contributor
  const userProjectIds = new Set<string>([
    ...userTasks.map((t: any) => t.projectId).filter(Boolean),
    ...(user.assignedProjects || []).map((id: any) => id.toString()),
  ]);

  const relevantProjects = projects.filter((p: any) => {
    const pId = p._id.toString();
    const isAssignedPrj = userProjectIds.has(pId);
    const isMember = (p.members || []).some(
      (m: any) =>
        (m.id && m.id.toString() === userIdStr) ||
        (m.email && m.email === user.email)
    );
    return isAssignedPrj || isMember;
  });

  const relevantPrjIdSet = new Set<string>(relevantProjects.map((p: any) => p._id.toString()));
  const activeProjects = relevantProjects.filter((p: any) => p.status === 'In Progress');
  const completedProjects = relevantProjects.filter((p: any) => p.status === 'Completed');

  const totalHealth = relevantProjects.reduce((acc: number, p: any) => acc + (p.healthScore || 85), 0);
  const overallHealth = relevantProjects.length > 0 ? Math.round(totalHealth / relevantProjects.length) : 85;

  const relevantMilestones = milestones.filter(
    (m: any) => m.projectId && relevantPrjIdSet.has(m.projectId.toString())
  );

  const userActivityLogs = activityLogs.filter(
    (log: any) => log.userName === user.name
  );

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalProjects: relevantProjects.length,
        activeProjectsCount: activeProjects.length,
        completedProjectsCount: completedProjects.length,
        totalTasks: userTasks.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        overdueTasksCount: overdueTasks.length,
        totalClientsCount: 0,
        totalTeamMembersCount: 0,
        overallHealth,
        avgCapacity: user.workloadPercent || 50,
      },
      activeProjects: relevantProjects.slice(0, 5).map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        clientName: p.clientName,
        status: p.status,
        description: p.description,
        budget: 0,
        progress: p.progress,
        healthScore: p.healthScore || 85,
      })),
      upcomingMilestones: relevantMilestones.slice(0, 5).map((m: any) => ({
        id: m._id.toString(),
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        status: m.status,
        progress: m.progress,
        owner: m.owner ? { name: (m.owner as any).name || 'Team Lead' } : { name: 'Team Lead' },
      })),
      recentActivity: (userActivityLogs.length > 0 ? userActivityLogs : activityLogs).slice(0, 6).map((log: any) => ({
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
