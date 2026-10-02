import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ProjectService } from '../services/projectService';
import { ApiError, asyncHandler } from '../utils/errors';

// ─── Role helpers ────────────────────────────────────────────────────────────

const FULL_TASK_ROLES = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'] as const;
const RESTRICTED_TASK_ROLES = ['Developer', 'Designer', 'QA'] as const;

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

  if (role === 'Client') {
    throw new ApiError('Clients do not have access to task management.', 403);
  }

  let tasks = await ProjectService.getTasks(projectId);

  // Developers / Designers / QA only see their own assigned tasks
  if ((RESTRICTED_TASK_ROLES as readonly string[]).includes(role)) {
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
 * @access Private – All roles except Client
 *         • Developers / Designers / QA → only if assigned to the task
 */
export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
      throw new ApiError('You are not authorised to view this task.', 403);
    }
  }

  res.status(200).json({ success: true, task });
});

/**
 * @desc   Create new task
 * @route  POST /api/tasks
 * @access Private – Super Admin, Admin, Project Manager, Team Lead
 */
export const createTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const role = req.user!.role;

  if (!(FULL_TASK_ROLES as readonly string[]).includes(role)) {
    throw new ApiError(
      `Role '${role}' is not authorised to create tasks.`,
      403
    );
  }

  const task = await ProjectService.createTask(req.body, req.user!._id.toString());
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
    throw new ApiError('Clients do not have access to task management.', 403);
  }

  const task = await ProjectService.getTaskById(id);

  if ((RESTRICTED_TASK_ROLES as readonly string[]).includes(role)) {
    // Must be assignee
    const isAssignee =
      task.assignee?.id === user._id.toString() ||
      task.assignee?.email === user.email;
    if (!isAssignee) {
      throw new ApiError('You can only update tasks assigned to you.', 403);
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

  const updated = await ProjectService.updateTask(id, req.body);
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
