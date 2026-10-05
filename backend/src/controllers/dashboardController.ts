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

  // Executive Scope: Company-wide overview
  const isExecutive = ['Super Admin', 'Admin', 'Project Manager'].includes(role);

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

  // Non-Executive Scoping (Team Leads, Project Coordinators, Developers, Designers, QA)
  const userIdStr = user._id.toString();
  const userEmailLower = (user.email || '').toLowerCase();
  const userNameLower = (user.name || '').toLowerCase();

  // Helper: check if a task is assigned to or created by the user
  const isTaskAssignedToUser = (t: any): boolean => {
    if (!t) return false;
    const aId = t.assignee?.id ? t.assignee.id.toString() : (t.assignee?._id ? t.assignee._id.toString() : '');
    const aEmail = t.assignee?.email ? t.assignee.email.toLowerCase() : '';
    const isCreated = t.createdBy && t.createdBy.toString() === userIdStr;
    return aId === userIdStr || (!!aEmail && aEmail === userEmailLower) || isCreated;
  };

  // Helper: check if user is manager, member, or assigned to a project
  const isUserInProject = (p: any): boolean => {
    if (!p) return false;
    const pIdStr = p._id.toString();
    const isManager = p.manager && (
      (p.manager.id && p.manager.id.toString() === userIdStr) ||
      (p.manager.email && p.manager.email.toLowerCase() === userEmailLower)
    );
    const isMember = (p.members || []).some((m: any) =>
      (m.id && m.id.toString() === userIdStr) ||
      (m.email && m.email.toLowerCase() === userEmailLower)
    );
    const isCreated = p.createdBy && p.createdBy.toString() === userIdStr;
    const isAssigned = (user.assignedProjects || []).some((apId: any) => apId.toString() === pIdStr);
    return isManager || isMember || isCreated || isAssigned;
  };

  const isTeamOrProjectScoped = ['Team Lead', 'Project Coordinator'].includes(role);

  let relevantProjects: any[] = [];
  let scopedTasks: any[] = [];

  if (isTeamOrProjectScoped) {
    relevantProjects = projects.filter(isUserInProject);
    if (relevantProjects.length === 0) {
      const assignedTaskPrjIds = new Set(tasks.filter(isTaskAssignedToUser).map((t: any) => t.projectId).filter(Boolean));
      relevantProjects = projects.filter((p: any) => assignedTaskPrjIds.has(p._id.toString()));
    }
    const relevantPrjIdSet = new Set(relevantProjects.map((p: any) => p._id.toString()));
    scopedTasks = tasks.filter((t: any) => (t.projectId && relevantPrjIdSet.has(t.projectId.toString())) || isTaskAssignedToUser(t));
  } else {
    // Individual Contributor (Developer, Designer, QA)
    scopedTasks = tasks.filter(isTaskAssignedToUser);
    const assignedPrjIds = new Set(scopedTasks.map((t: any) => t.projectId).filter(Boolean));
    relevantProjects = projects.filter((p: any) => isUserInProject(p) || assignedPrjIds.has(p._id.toString()));
  }

  const relevantPrjIdSet = new Set(relevantProjects.map((p: any) => p._id.toString()));

  const activeProjects = relevantProjects.filter((p: any) => p.status === 'In Progress');
  const completedProjects = relevantProjects.filter((p: any) => p.status === 'Completed');

  const pendingTasks = scopedTasks.filter((t: any) => t.status !== 'Completed');
  const completedTasks = scopedTasks.filter((t: any) => t.status === 'Completed');
  const overdueTasks = scopedTasks.filter(
    (t: any) => t.status !== 'Completed' && new Date(t.dueDate) < new Date()
  );

  const totalHealth = relevantProjects.reduce((acc: number, p: any) => acc + (p.healthScore || 85), 0);
  const overallHealth = relevantProjects.length > 0 ? Math.round(totalHealth / relevantProjects.length) : 85;

  // Filter milestones belonging to relevant projects or owned by user
  const relevantMilestones = milestones.filter((m: any) => {
    const isPrjMatch = m.projectId && relevantPrjIdSet.has(m.projectId.toString());
    const isOwnerMatch = m.owner && (
      (m.owner.id && m.owner.id.toString() === userIdStr) ||
      (m.owner.email && m.owner.email.toLowerCase() === userEmailLower)
    );
    return isPrjMatch || isOwnerMatch;
  });

  // Filter activity logs relevant to projects or user
  const relevantActivityLogs = activityLogs.filter((log: any) => {
    const isPrjMatch = log.projectId && relevantPrjIdSet.has(log.projectId.toString());
    const isUserMatch = (log.userId && log.userId.toString() === userIdStr) ||
      (log.userName && log.userName.toLowerCase() === userNameLower);
    return isPrjMatch || isUserMatch;
  });

  // Calculate dynamic metrics
  const distinctClientNames = new Set(relevantProjects.map((p: any) => p.clientName).filter(Boolean));
  const distinctMemberIds = new Set<string>();
  relevantProjects.forEach((p: any) => {
    if (p.manager?.id) distinctMemberIds.add(p.manager.id.toString());
    (p.members || []).forEach((m: any) => {
      if (m.id) distinctMemberIds.add(m.id.toString());
    });
  });

  const totalClientsCount = distinctClientNames.size || (relevantProjects.length > 0 ? 1 : 0);
  const totalTeamMembersCount = distinctMemberIds.size || 1;

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalProjects: relevantProjects.length,
        activeProjectsCount: activeProjects.length,
        completedProjectsCount: completedProjects.length,
        totalTasks: scopedTasks.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        overdueTasksCount: overdueTasks.length,
        totalClientsCount,
        totalTeamMembersCount,
        overallHealth,
        avgCapacity: user.workloadPercent || 65,
      },
      activeProjects: relevantProjects.slice(0, 5).map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        clientName: p.clientName,
        status: p.status,
        description: p.description,
        budget: p.budget || 0,
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
      recentActivity: (relevantActivityLogs.length > 0 ? relevantActivityLogs : activityLogs).slice(0, 6).map((log: any) => ({
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
