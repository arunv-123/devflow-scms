import mongoose from 'mongoose';
import { NotificationModel, NotificationType, NotificationPriority } from '../models/notificationModel';
import { User } from '../models/userModel';
import { Project } from '../models/projectModel';
import { ITask, IMilestone, IProject } from '../types/project';
import { IMeeting } from '../types/crm';

export interface CreateNotificationInput {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityId?: string;
  entityType?: 'task' | 'milestone' | 'project' | 'meeting' | 'ai';
  projectId?: string;
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Helper to resolve a string ID/email/name or ObjectId into a valid string user ID
   */
  private static async resolveUserId(userRef: string | mongoose.Types.ObjectId | undefined | null): Promise<string | null> {
    if (!userRef) return null;
    const refStr = userRef.toString().trim();
    if (!refStr || refStr === 'unassigned') return null;

    // Check if valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(refStr)) {
      const user = await User.findById(refStr);
      if (user) return user._id.toString();
    }

    // Try finding by email or name if it's a seed ID or name
    const user = await User.findOne({
      $or: [
        { email: refStr },
        { name: refStr },
        { email: new RegExp(`^${refStr}$`, 'i') },
      ],
    });

    if (user) return user._id.toString();
    return null;
  }

  /**
   * Directly create a notification in database
   */
  static async createNotification(input: CreateNotificationInput): Promise<void> {
    try {
      const targetUserId = await this.resolveUserId(input.userId);
      if (!targetUserId) return;

      await NotificationModel.create({
        userId: targetUserId,
        type: input.type,
        title: input.title,
        message: input.message,
        priority: input.priority || 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        entityId: input.entityId,
        entityType: input.entityType,
        projectId: input.projectId,
        actionUrl: input.actionUrl,
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  /**
   * Helper to get user IDs for project members and managers
   */
  static async getProjectUserIds(projectId: string, excludeUserId?: string): Promise<string[]> {
    try {
      const project = await Project.findById(projectId);
      if (!project) return [];

      const candidateRefs: string[] = [];
      if (project.manager?.id) candidateRefs.push(project.manager.id);
      if (project.manager?.email) candidateRefs.push(project.manager.email);
      if (Array.isArray(project.members)) {
        project.members.forEach((m) => {
          if (m.id) candidateRefs.push(m.id);
          if (m.email) candidateRefs.push(m.email);
        });
      }

      const users = await User.find({
        $or: [
          { _id: { $in: candidateRefs.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
          { email: { $in: candidateRefs } },
        ],
      });

      const userIds = users.map((u) => u._id.toString());
      if (excludeUserId) {
        return userIds.filter((id) => id !== excludeUserId.toString());
      }
      return userIds;
    } catch (err) {
      console.error('Error fetching project user IDs:', err);
      return [];
    }
  }

  /**
   * Get user IDs for project leads (Super Admin, Admin, PM, Team Lead)
   */
  static async getProjectLeadUserIds(projectId: string, excludeUserId?: string): Promise<string[]> {
    try {
      const allProjectUserIds = await this.getProjectUserIds(projectId, excludeUserId);
      if (allProjectUserIds.length === 0) return [];

      const leads = await User.find({
        _id: { $in: allProjectUserIds },
        role: { $in: ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'] },
      });

      return leads.map((u) => u._id.toString());
    } catch (err) {
      console.error('Error fetching project lead user IDs:', err);
      return [];
    }
  }

  // ================= TASKS =================

  static async notifyTaskAssigned(params: {
    task: ITask;
    newAssigneeId?: string;
    newAssigneeName?: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { task, newAssigneeId, newAssigneeName, actorUserId, actorName } = params;
    const targetUserId = await this.resolveUserId(newAssigneeId || newAssigneeName || task.assignee?.id || task.assignee?.email);
    if (!targetUserId) return;

    // Do not notify actor if assigning to oneself (unless desired, but user assignment usually notifies recipient)
    if (actorUserId && targetUserId === actorUserId.toString()) return;

    await this.createNotification({
      userId: targetUserId,
      type: 'task',
      title: 'New Task Assigned',
      message: `${actorName || 'Someone'} assigned you to task "${task.title}" in project "${task.projectName}".`,
      priority: task.priority === 'Critical' || task.priority === 'High' ? 'high' : 'medium',
      entityId: task._id?.toString(),
      entityType: 'task',
      projectId: task.projectId,
      actionUrl: `/tasks?taskId=${task._id?.toString()}&projectId=${task.projectId}`,
    });
  }

  static async notifyTaskReassigned(params: {
    task: ITask;
    prevAssigneeId?: string;
    newAssigneeId?: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { task, prevAssigneeId, newAssigneeId, actorUserId, actorName } = params;

    const newTargetId = await this.resolveUserId(newAssigneeId || task.assignee?.id);
    const prevTargetId = await this.resolveUserId(prevAssigneeId);

    if (newTargetId && (!actorUserId || newTargetId !== actorUserId.toString())) {
      await this.createNotification({
        userId: newTargetId,
        type: 'task',
        title: 'Task Assigned to You',
        message: `${actorName || 'Someone'} reassigned task "${task.title}" to you in project "${task.projectName}".`,
        priority: 'high',
        entityId: task._id?.toString(),
        entityType: 'task',
        projectId: task.projectId,
        actionUrl: `/tasks?taskId=${task._id?.toString()}&projectId=${task.projectId}`,
      });
    }

    if (prevTargetId && prevTargetId !== newTargetId && (!actorUserId || prevTargetId !== actorUserId.toString())) {
      await this.createNotification({
        userId: prevTargetId,
        type: 'task',
        title: 'Task Reassigned',
        message: `Task "${task.title}" in project "${task.projectName}" was reassigned to another team member.`,
        priority: 'low',
        entityId: task._id?.toString(),
        entityType: 'task',
        projectId: task.projectId,
        actionUrl: `/tasks?taskId=${task._id?.toString()}&projectId=${task.projectId}`,
      });
    }
  }

  static async notifyTaskStatusChanged(params: {
    task: ITask;
    oldStatus: string;
    newStatus: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { task, oldStatus, newStatus, actorUserId, actorName } = params;
    if (oldStatus === newStatus) return; // DEDUPLICATION FIX: Do not create duplicate notification if status unchanged

    const actionUrl = `/tasks?taskId=${task._id?.toString()}&projectId=${task.projectId}`;

    // 1. Notify Assignee if not actor
    const assigneeUserId = await this.resolveUserId(task.assignee?.id || task.assignee?.email);
    if (assigneeUserId && (!actorUserId || assigneeUserId !== actorUserId.toString())) {
      await this.createNotification({
        userId: assigneeUserId,
        type: 'task',
        title: `Task Status Updated: ${task.title}`,
        message: `Task "${task.title}" was moved from "${oldStatus}" to "${newStatus}" by ${actorName || 'a team member'}.`,
        priority: newStatus === 'Completed' ? 'high' : 'medium',
        entityId: task._id?.toString(),
        entityType: 'task',
        projectId: task.projectId,
        actionUrl,
      });
    }

    // 2. If task completed, notify PM / Leads
    if (newStatus === 'Completed') {
      const leadUserIds = await this.getProjectLeadUserIds(task.projectId, actorUserId);
      for (const leadId of leadUserIds) {
        if (leadId !== assigneeUserId) {
          await this.createNotification({
            userId: leadId,
            type: 'task',
            title: `Task Completed: ${task.title}`,
            message: `Task "${task.title}" in project "${task.projectName}" was marked as completed by ${actorName || 'assignee'}.`,
            priority: 'high',
            entityId: task._id?.toString(),
            entityType: 'task',
            projectId: task.projectId,
            actionUrl,
          });
        }
      }
    }
  }

  // ================= MILESTONES =================

  static async notifyMilestoneCreated(params: {
    milestone: IMilestone;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { milestone, actorUserId, actorName } = params;
    const projectUserIds = await this.getProjectUserIds(milestone.projectId, actorUserId);

    for (const userId of projectUserIds) {
      await this.createNotification({
        userId,
        type: 'milestone',
        title: `New Milestone Created`,
        message: `${actorName || 'A team lead'} created milestone "${milestone.title}" in project "${milestone.projectName}".`,
        priority: 'medium',
        entityId: milestone._id?.toString(),
        entityType: 'milestone',
        projectId: milestone.projectId,
        actionUrl: `/milestones?milestoneId=${milestone._id?.toString()}&projectId=${milestone.projectId}`,
      });
    }
  }

  static async notifyMilestoneStatusChanged(params: {
    milestone: IMilestone;
    oldStatus: string;
    newStatus: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { milestone, oldStatus, newStatus, actorUserId, actorName } = params;
    if (oldStatus === newStatus) return; // Deduplicate

    const isAchieved = newStatus === 'Achieved';
    const projectUserIds = await this.getProjectUserIds(milestone.projectId, actorUserId);

    for (const userId of projectUserIds) {
      await this.createNotification({
        userId,
        type: 'milestone',
        title: isAchieved ? `Milestone Achieved: ${milestone.title}` : `Milestone Status: ${milestone.title}`,
        message: isAchieved
          ? `🎉 Milestone "${milestone.title}" in project "${milestone.projectName}" has been successfully achieved!`
          : `Milestone "${milestone.title}" status changed from "${oldStatus}" to "${newStatus}" by ${actorName || 'a team member'}.`,
        priority: isAchieved ? 'high' : 'medium',
        entityId: milestone._id?.toString(),
        entityType: 'milestone',
        projectId: milestone.projectId,
        actionUrl: `/milestones?milestoneId=${milestone._id?.toString()}&projectId=${milestone.projectId}`,
      });
    }
  }

  static async notifyTaskLinkedToMilestone(params: {
    taskTitle: string;
    taskId: string;
    milestoneTitle: string;
    milestoneId: string;
    projectId: string;
    assigneeUserId?: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { taskTitle, taskId, milestoneTitle, milestoneId, projectId, assigneeUserId, actorUserId, actorName } = params;

    const targetUserId = await this.resolveUserId(assigneeUserId);
    if (targetUserId && (!actorUserId || targetUserId !== actorUserId.toString())) {
      await this.createNotification({
        userId: targetUserId,
        type: 'milestone',
        title: 'Task Linked to Milestone',
        message: `Task "${taskTitle}" was linked to milestone "${milestoneTitle}" by ${actorName || 'DevFlow AI/Team'}.`,
        priority: 'medium',
        entityId: milestoneId,
        entityType: 'milestone',
        projectId,
        actionUrl: `/milestones?milestoneId=${milestoneId}&projectId=${projectId}`,
      });
    }
  }

  // ================= PROJECT / MEMBERS =================

  static async notifyUserAddedToProject(params: {
    project: IProject;
    addedUserId: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { project, addedUserId, actorUserId, actorName } = params;
    const targetUserId = await this.resolveUserId(addedUserId);
    if (!targetUserId || (actorUserId && targetUserId === actorUserId.toString())) return;

    await this.createNotification({
      userId: targetUserId,
      type: 'project',
      title: 'Added to Project',
      message: `You were added to project "${project.name}" by ${actorName || 'Project Admin'}.`,
      priority: 'high',
      entityId: project._id?.toString(),
      entityType: 'project',
      projectId: project._id?.toString(),
      actionUrl: `/projects?projectId=${project._id?.toString()}`,
    });
  }

  static async notifyUserRemovedFromProject(params: {
    projectName: string;
    projectId: string;
    removedUserId: string;
    actorName?: string;
  }): Promise<void> {
    const { projectName, projectId, removedUserId, actorName } = params;
    const targetUserId = await this.resolveUserId(removedUserId);
    if (!targetUserId) return;

    await this.createNotification({
      userId: targetUserId,
      type: 'project',
      title: 'Removed from Project',
      message: `You were removed from project "${projectName}" by ${actorName || 'Project Admin'}.`,
      priority: 'medium',
      entityId: projectId,
      entityType: 'project',
      projectId,
      actionUrl: `/projects`,
    });
  }

  // ================= MEETINGS =================

  static async notifyMeetingEvent(params: {
    meeting: IMeeting;
    eventType: 'created' | 'updated' | 'cancelled';
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { meeting, eventType, actorUserId, actorName } = params;

    // Find users by participant IDs or participant names/emails
    const participants = meeting.participants || [];
    const participantIds = (meeting.participantIds || []).filter(Boolean);

    const userQueries: any[] = [];
    if (participantIds.length > 0) {
      userQueries.push({ _id: { $in: participantIds } });
    }
    if (participants.length > 0) {
      userQueries.push({ name: { $in: participants } });
      userQueries.push({ email: { $in: participants } });
    }

    if (userQueries.length === 0) return;

    const matchedUsers = await User.find({ $or: userQueries });

    const actionUrl = `/crm?tab=meetings&meetingId=${meeting._id?.toString()}`;
    const titles = {
      created: `New Meeting Scheduled: ${meeting.title}`,
      updated: `Meeting Updated: ${meeting.title}`,
      cancelled: `Meeting Cancelled: ${meeting.title}`,
    };

    const messages = {
      created: `Meeting "${meeting.title}" scheduled for ${meeting.date} at ${meeting.time} with ${meeting.clientName}.`,
      updated: `Details for meeting "${meeting.title}" on ${meeting.date} were updated by ${actorName || 'host'}.`,
      cancelled: `Meeting "${meeting.title}" scheduled for ${meeting.date} has been cancelled.`,
    };

    for (const u of matchedUsers) {
      const uId = u._id.toString();
      if (!actorUserId || uId !== actorUserId.toString()) {
        await this.createNotification({
          userId: uId,
          type: 'meeting',
          title: titles[eventType],
          message: messages[eventType],
          priority: eventType === 'cancelled' ? 'high' : 'medium',
          entityId: meeting._id?.toString(),
          entityType: 'meeting',
          actionUrl,
        });
      }
    }
  }

  // ================= ADDITIONAL ROLE-SPECIFIC NOTIFICATION EVENTS =================

  static async notifyTaskPriorityChanged(params: {
    task: ITask;
    oldPriority: string;
    newPriority: string;
    actorUserId?: string;
    actorName?: string;
  }): Promise<void> {
    const { task, oldPriority, newPriority, actorUserId, actorName } = params;
    if (oldPriority === newPriority) return; // Deduplicate

    const actionUrl = `/tasks?taskId=${task._id?.toString()}&projectId=${task.projectId}`;

    // 1. Notify Assignee if not actor
    const assigneeUserId = await this.resolveUserId(task.assignee?.id || task.assignee?.email);
    if (assigneeUserId && (!actorUserId || assigneeUserId !== actorUserId.toString())) {
      await this.createNotification({
        userId: assigneeUserId,
        type: 'task',
        title: `Task Priority Changed: ${task.title}`,
        message: `Priority for task "${task.title}" was updated from "${oldPriority}" to "${newPriority}" by ${actorName || 'a manager'}.`,
        priority: newPriority === 'Critical' || newPriority === 'High' ? 'high' : 'medium',
        entityId: task._id?.toString(),
        entityType: 'task',
        projectId: task.projectId,
        actionUrl,
      });
    }

    // 2. If priority escalated to Critical/High, notify PM / Leads
    if (newPriority === 'Critical' || newPriority === 'High') {
      const leadUserIds = await this.getProjectLeadUserIds(task.projectId, actorUserId);
      for (const leadId of leadUserIds) {
        if (leadId !== assigneeUserId) {
          await this.createNotification({
            userId: leadId,
            type: 'task',
            title: `Task Priority Escalated: ${task.title}`,
            message: `Task "${task.title}" in project "${task.projectName}" priority escalated to ${newPriority}.`,
            priority: 'high',
            entityId: task._id?.toString(),
            entityType: 'task',
            projectId: task.projectId,
            actionUrl,
          });
        }
      }
    }
  }

  // ================= AI ACTION CONFIRMATION =================

  static async notifyAiActionCommitted(params: {
    userId: string;
    title: string;
    message: string;
    entityId?: string;
    entityType?: 'task' | 'milestone' | 'project' | 'meeting' | 'ai';
    projectId?: string;
    actionUrl?: string;
  }): Promise<void> {
    await this.createNotification({
      userId: params.userId,
      type: 'ai',
      title: params.title,
      message: params.message,
      priority: 'high',
      entityId: params.entityId,
      entityType: params.entityType || 'ai',
      projectId: params.projectId,
      actionUrl: params.actionUrl,
    });
  }

  static async notifyProjectHealthCritical(params: {
    project: IProject;
    healthScore: number;
    riskLevel: string;
  }): Promise<void> {
    const { project, healthScore, riskLevel } = params;
    const leadUserIds = await this.getProjectLeadUserIds(project._id?.toString());

    for (const leadId of leadUserIds) {
      await this.createNotification({
        userId: leadId,
        type: 'project',
        title: `⚠️ Project Health Alert: ${project.name}`,
        message: `Project "${project.name}" health score has dropped to ${healthScore}% (${riskLevel} Risk Level). Immediate management review recommended.`,
        priority: 'high',
        entityId: project._id?.toString(),
        entityType: 'project',
        projectId: project._id?.toString(),
        actionUrl: `/projects?projectId=${project._id?.toString()}`,
      });
    }
  }
}
