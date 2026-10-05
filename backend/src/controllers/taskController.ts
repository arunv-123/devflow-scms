import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ProjectService } from '../services/projectService';
import { ApiError, asyncHandler } from '../utils/errors';

// ─── Role helpers ────────────────────────────────────────────────────────────

const FULL_TASK_ROLES = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'] as const;
const RESTRICTED_TASK_ROLES = ['Developer', 'Designer', 'QA', 'Project Coordinator'] as const;

// Roles that CANNOT be assigned work tasks (internal work only for team members)
const NON_ASSIGNABLE_ROLES = ['Client'] as const;

// ─── TASKS ───────────────────────────────────────────────────────────────────

/**
 * @desc   Get all tasks (filtered by projectId if provided)
 * @route  GET /api/tasks
 * @access Private – All roles
 *         • Super Admin / Admin / PM / Team Lead → see all tasks (or project-scoped)
 *         • Developer / Designer / QA → only tasks assigned to them
 *         • Client → forbidden (no task-management access)
 */
export const getTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const role = user.role;
  const projectId = req.query.projectId as string | undefined;

  let tasks = await ProjectService.getTasks(projectId);

  // Developers / Designers / QA only see their own assigned tasks
  if (['Developer', 'Designer', 'QA'].includes(role)) {
    const userId = user._id.toString();
    tasks = tasks.filter(
      (t) => t.assignee?.id === userId || t.assignee?.email === user.email
    );
  }

  res.status(200).json({ success: true, count: tasks.length, tasks });
});

/**
 * @desc   Get single task by ID
 * @route  GET /api/tasks/:id
 * @access Private – All roles (Client is view-only)
 *         • Developers / Designers / QA → only if assigned to the task
 */
export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const role = user.role;
  const id = req.params['id'] as string;

  const task = await ProjectService.getTaskById(id);

  if (['Developer', 'Designer', 'QA'].includes(role)) {
    const isAssignee =
      task.assignee?.id === user._id.toString() ||
      task.assignee?.email === user.email;
    if (!isAssignee) {
      throw new ApiError('You are not authorised to view this task.', 403);
    }
  }

  res.status(200).json({ success: true, task });
});

/**
 * @desc   Get eligible assignees for a given project
 *         Returns project members (from project.members + manager) filtered to exclude Client roles.
 *         Also enriches with workload/availability from User collection where possible.
 * @route  GET /api/tasks/eligible-assignees?projectId=:projectId
 * @access Private – Super Admin, Admin, Project Manager, Team Lead
 */
export const getEligibleAssignees = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const role = req.user!.role;

  if (!(FULL_TASK_ROLES as readonly string[]).includes(role)) {
    throw new ApiError(`Role '${role}' is not authorised to view task assignees.`, 403);
  }

  const projectId = req.query['projectId'] as string | undefined;
  if (!projectId) {
    throw new ApiError('projectId query parameter is required', 400);
  }

  const assignees = await ProjectService.getEligibleAssignees(projectId);
  res.status(200).json({ success: true, assignees });
});

/**
 * @desc   Create new task
 *         The creator is always the authenticated user (req.user); assignee is the team member
 *         responsible for performing the work, specified explicitly in req.body.assignee.
 * @route  POST /api/tasks
 * @access Private – Super Admin, Admin, Project Manager, Team Lead
 */
import { ActivityLogModel } from '../models/activityLogModel';
import { NotificationService } from '../services/notificationService';

export const createTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const role = req.user!.role;

  if (!(FULL_TASK_ROLES as readonly string[]).includes(role)) {
    throw new ApiError(
      `Role '${role}' is not authorised to create tasks.`,
      403
    );
  }

  // Prevent assigning tasks to Clients
  if (req.body.assignee?.role && (NON_ASSIGNABLE_ROLES as readonly string[]).includes(req.body.assignee.role)) {
    throw new ApiError(`Cannot assign a task to a user with role '${req.body.assignee.role}'.`, 400);
  }

  const task = await ProjectService.createTask(req.body, req.user!._id.toString());

  // Log Activity & notify assignee if assigned to a team member
  if (task.assignee && task.assignee.id && task.assignee.id !== 'unassigned') {
    try {
      await ActivityLogModel.create({
        userName: req.user?.name || 'Authenticated User',
        userRole: req.user?.role || 'Project Manager',
        userId: req.user?._id?.toString(),
        userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        action: 'Task Assigned',
        entity: task.title,
        entityId: task._id.toString(),
        projectId: task.projectId,
        projectName: task.projectName,
        description: `Assigned task "${task.title}" to "${task.assignee.name}" (${task.assignee.role})`,
        metadata: {
          previousAssignee: { id: 'unassigned', name: 'Unassigned', role: 'Unassigned' },
          newAssignee: task.assignee,
        },
      });
    } catch (e) {
      console.error('Failed to log task creation assignment activity:', e);
    }

    try {
      await NotificationService.notifyTaskAssigned({
        task,
        newAssigneeId: task.assignee.id,
        newAssigneeName: task.assignee.name,
        actorUserId: req.user?._id?.toString(),
        actorName: req.user?.name,
      });
    } catch (e) {
      console.error('Failed to notify task assignment:', e);
    }
  }

  res.status(201).json({ success: true, task, message: 'Task created successfully' });
});

/**
 * @desc   Update task
 * @route  PUT /api/tasks/:id
 * @access Private
 *         • Super Admin / Admin / PM / Team Lead → can update any field
 *         • Developer / Designer / QA → can ONLY update status on their own tasks
 *         • Client → forbidden
 */
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const role = user.role;
  const id = req.params['id'] as string;

  if (role === 'Client') {
    throw new ApiError('Clients do not have access to task management or status updates.', 403);
  }

  const task = await ProjectService.getTaskById(id);

  if ((RESTRICTED_TASK_ROLES as readonly string[]).includes(role)) {
    // Must be assigned assignee
    const isAssignee =
      task.assignee?.id === user._id.toString() ||
      task.assignee?.email === user.email ||
      task.assignee?.name === user.name;

    if (!isAssignee) {
      if (role === 'Project Coordinator') {
        throw new ApiError(
          'Project Coordinators are not permitted to manage day-to-day task status unless explicitly assigned to the task.',
          403
        );
      } else if (role === 'Developer' || role === 'Designer') {
        throw new ApiError('Developers and Designers can change status only for their assigned tasks.', 403);
      } else if (role === 'QA') {
        throw new ApiError('QA team members can only update status for tasks they are responsible for.', 403);
      } else {
        throw new ApiError(`Role '${role}' is not authorised to update status for tasks not assigned to them.`, 403);
      }
    }

    // Only allow status updates (and progress-related fields)
    const ALLOWED_FIELDS_RESTRICTED = ['status', 'subtasks', 'commentsCount'];
    const requestedKeys = Object.keys(req.body);
    const forbidden = requestedKeys.filter((k) => !ALLOWED_FIELDS_RESTRICTED.includes(k));
    if (forbidden.length > 0) {
      throw new ApiError(
        `Role '${role}' is not authorised to update field(s): ${forbidden.join(', ')}.`,
        403
      );
    }
  }

  // Check if assignee/status/priority is changing
  const previousStatus = task.status;
  const previousPriority = task.priority;
  const previousAssignee = task.assignee || { id: 'unassigned', name: 'Unassigned', role: 'Unassigned' };
  const updated = await ProjectService.updateTask(id, req.body);

  // Priority Change Notification System Integration
  if (req.body.priority && req.body.priority !== previousPriority) {
    try {
      await NotificationService.notifyTaskPriorityChanged({
        task: updated,
        oldPriority: previousPriority,
        newPriority: req.body.priority,
        actorUserId: user._id?.toString(),
        actorName: user.name,
      });
    } catch (e) {
      console.error('Failed to notify task priority change:', e);
    }
  }

  // Status Change Activity Log & Notification System Integration
  if (req.body.status && req.body.status !== previousStatus) {
    const newStatus = req.body.status;

    try {
      await ActivityLogModel.create({
        userName: user.name || 'Authenticated User',
        userRole: user.role || 'Team Member',
        userId: user._id?.toString(),
        userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        action: 'Status Changed',
        entity: updated.title,
        entityId: updated._id.toString(),
        projectId: updated.projectId,
        projectName: updated.projectName,
        description: `Moved task "${updated.title}" from "${previousStatus}" to "${newStatus}"`,
        metadata: {
          previousStatus,
          newStatus,
        },
      });
    } catch (e) {
      console.error('Failed to log task status change activity:', e);
    }

    try {
      await NotificationService.notifyTaskStatusChanged({
        task: updated,
        oldStatus: previousStatus,
        newStatus,
        actorUserId: user._id?.toString(),
        actorName: user.name,
      });
    } catch (e) {
      console.error('Failed to create status change notification:', e);
    }
  }

  if (req.body.assignee) {
    const newAssignee = req.body.assignee;
    const prevId = previousAssignee.id || 'unassigned';
    const newId = newAssignee.id || 'unassigned';

    if (prevId !== newId || previousAssignee.name !== newAssignee.name) {
      const prevName = previousAssignee.name || 'Unassigned';
      const newName = newAssignee.name || 'Unassigned';
      const isInitialAssign = prevName === 'Unassigned' || prevId === 'unassigned';

      try {
        await ActivityLogModel.create({
          userName: user.name || 'Authenticated User',
          userRole: user.role || 'Project Manager',
          userId: user._id?.toString(),
          userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          action: isInitialAssign ? 'Task Assigned' : 'Task Reassigned',
          entity: updated.title,
          entityId: updated._id.toString(),
          projectId: updated.projectId,
          projectName: updated.projectName,
          description: isInitialAssign
            ? `Assigned task "${updated.title}" to "${newName}"`
            : `Reassigned task "${updated.title}" from "${prevName}" to "${newName}"`,
          metadata: {
            previousAssignee,
            newAssignee,
          },
        });
      } catch (e) {
        console.error('Failed to log task assignment activity:', e);
      }

      try {
        await NotificationService.notifyTaskReassigned({
          task: updated,
          prevAssigneeId: prevId,
          newAssigneeId: newId,
          actorUserId: user._id?.toString(),
          actorName: user.name,
        });
      } catch (e) {
        console.error('Failed to notify task reassignment:', e);
      }
    }
  }

  res.status(200).json({ success: true, task: updated, message: 'Task updated successfully' });
});

/**
 * @desc   Delete task
 * @route  DELETE /api/tasks/:id
 * @access Private – Super Admin, Admin, Project Manager
 */
export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const role = req.user!.role;
  const id = req.params['id'] as string;

  if (!['Super Admin', 'Admin', 'Project Manager'].includes(role)) {
    throw new ApiError(
      `Role '${role}' is not authorised to delete tasks.`,
      403
    );
  }

  await ProjectService.deleteTask(id);
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

// ─── SUBTASKS ────────────────────────────────────────────────────────────────

/**
 * @desc   Add subtask to a task
 * @route  POST /api/tasks/:id/subtasks
 * @access Private – Super Admin, Admin, PM, Team Lead, or task assignee (Dev/Designer/QA)
 */
export const addSubtask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const role = user.role;
  const id = req.params['id'] as string;

  if (role === 'Client') {
    throw new ApiError('Clients do not have access to task management.', 403);
  }

  const task = await ProjectService.getTaskById(id);

  if ((RESTRICTED_TASK_ROLES as readonly string[]).includes(role)) {
    const isAssignee =
      task.assignee?.id === user._id.toString() ||
      task.assignee?.email === user.email;
    if (!isAssignee) {
      throw new ApiError('You can only add subtasks to tasks assigned to you.', 403);
    }
  }

  const { title } = req.body;
  const updated = await ProjectService.addSubtask(id, title);
  res.status(201).json({ success: true, task: updated, message: 'Subtask added successfully' });
});

/**
 * @desc   Update subtask status or title
 * @route  PUT /api/tasks/:id/subtasks/:subtaskId
 * @access Private – Super Admin, Admin, PM, Team Lead, or task assignee (Dev/Designer/QA)
 */
export const updateSubtask = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const role = user.role;
    const id = req.params['id'] as string;
    const subtaskId = req.params['subtaskId'] as string;

    if (role === 'Client') {
      throw new ApiError('Clients do not have access to task management.', 403);
    }

    const task = await ProjectService.getTaskById(id);

    if ((RESTRICTED_TASK_ROLES as readonly string[]).includes(role)) {
      const isAssignee =
        task.assignee?.id === user._id.toString() ||
        task.assignee?.email === user.email;
      if (!isAssignee) {
        throw new ApiError('You can only update subtasks on tasks assigned to you.', 403);
      }
    }

    const { completed, title } = req.body;
    const updated = await ProjectService.updateSubtask(id, subtaskId, completed, title);
    res.status(200).json({ success: true, task: updated, message: 'Subtask updated successfully' });
  }
);

/**
 * @desc   Delete subtask
 * @route  DELETE /api/tasks/:id/subtasks/:subtaskId
 * @access Private – Super Admin, Admin, Project Manager, Team Lead
 */
export const deleteSubtask = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const role = req.user!.role;
    const id = req.params['id'] as string;
    const subtaskId = req.params['subtaskId'] as string;

    if (!(FULL_TASK_ROLES as readonly string[]).includes(role)) {
      throw new ApiError(
        `Role '${role}' is not authorised to delete subtasks.`,
        403
      );
    }

    const updated = await ProjectService.deleteSubtask(id, subtaskId);
    res.status(200).json({ success: true, task: updated, message: 'Subtask deleted successfully' });
  }
);
