import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ProjectService } from '../services/projectService';
import { asyncHandler } from '../utils/errors';

// ================= PROJECTS =================

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const projects = await ProjectService.getProjects();
  res.status(200).json({ success: true, count: projects.length, projects });
});

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const project = await ProjectService.getProjectById(id);
  res.status(200).json({ success: true, project });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await ProjectService.createProject(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, project, message: 'Project created successfully' });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const project = await ProjectService.updateProject(id, req.body);
  res.status(200).json({ success: true, project, message: 'Project updated successfully' });
});

// @desc    Delete/Archive project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await ProjectService.deleteProject(id);
  res.status(200).json({ success: true, message: 'Project deleted successfully' });
});

// ================= TASKS =================

// @desc    Get all tasks (optionally filtered by projectId)
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.query.projectId as string | undefined;
  const tasks = await ProjectService.getTasks(projectId);
  res.status(200).json({ success: true, count: tasks.length, tasks });
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const task = await ProjectService.getTaskById(id);
  res.status(200).json({ success: true, task });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await ProjectService.createTask(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, task, message: 'Task created successfully' });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const task = await ProjectService.updateTask(id, req.body);
  res.status(200).json({ success: true, task, message: 'Task updated successfully' });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await ProjectService.deleteTask(id);
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

// ================= SUBTASKS =================

// @desc    Add subtask to task
// @route   POST /api/tasks/:id/subtasks
// @access  Private
export const addSubtask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const taskId = req.params.id as string;
  const { title } = req.body;
  const task = await ProjectService.addSubtask(taskId, title);
  res.status(201).json({ success: true, task, message: 'Subtask added successfully' });
});

// @desc    Update subtask status or title
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @access  Private
export const updateSubtask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const taskId = req.params.id as string;
  const subtaskId = req.params.subtaskId as string;
  const { completed, title } = req.body;
  const task = await ProjectService.updateSubtask(taskId, subtaskId, completed, title);
  res.status(200).json({ success: true, task, message: 'Subtask updated successfully' });
});

// @desc    Delete subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @access  Private
export const deleteSubtask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const taskId = req.params.id as string;
  const subtaskId = req.params.subtaskId as string;
  const task = await ProjectService.deleteSubtask(taskId, subtaskId);
  res.status(200).json({ success: true, task, message: 'Subtask deleted successfully' });
});

// ================= MILESTONES =================

// @desc    Get all milestones (optionally filtered by projectId)
// @route   GET /api/milestones
// @access  Private
export const getMilestones = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.query.projectId as string | undefined;
  const milestones = await ProjectService.getMilestones(projectId);
  res.status(200).json({ success: true, count: milestones.length, milestones });
});

// @desc    Get single milestone by ID
// @route   GET /api/milestones/:id
// @access  Private
export const getMilestoneById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const milestone = await ProjectService.getMilestoneById(id);
  res.status(200).json({ success: true, milestone });
});

// @desc    Create new milestone
// @route   POST /api/milestones
// @access  Private
export const createMilestone = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const milestone = await ProjectService.createMilestone(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, milestone, message: 'Milestone created successfully' });
});

// @desc    Update milestone
// @route   PUT /api/milestones/:id
// @access  Private
export const updateMilestone = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const milestone = await ProjectService.updateMilestone(id, req.body);
  res.status(200).json({ success: true, milestone, message: 'Milestone updated successfully' });
});

// @desc    Delete milestone
// @route   DELETE /api/milestones/:id
// @access  Private
export const deleteMilestone = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await ProjectService.deleteMilestone(id);
  res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
});
