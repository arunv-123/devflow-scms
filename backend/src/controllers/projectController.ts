import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ProjectService } from '../services/projectService';
import { ApiError, asyncHandler } from '../utils/errors';

// ================= PROJECTS =================

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Client sees only assigned projects; internal roles see all)
export const getProjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  let projects = await ProjectService.getProjects();

  if (user && user.role === 'Client') {
    const assignedProjectIds = (user.assignedProjects || []).map((id) => id.toString());
    projects = projects.filter((p) => {
      const pId = p._id.toString();
      const isAssigned = assignedProjectIds.includes(pId);
      const isMember = (p.members || []).some(
        (m) => m.id === user._id.toString() || m.email === user.email
      );
      return isAssigned || isMember;
    });
  }

  res.status(200).json({ success: true, count: projects.length, projects });
});

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (Client restricted to assigned projects)
export const getProjectById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const id = req.params.id as string;
  const project = await ProjectService.getProjectById(id);

  if (user && user.role === 'Client') {
    const assignedProjectIds = (user.assignedProjects || []).map((pid) => pid.toString());
    const pId = project._id.toString();
    const isAssigned = assignedProjectIds.includes(pId);
    const isMember = (project.members || []).some(
      (m) => m.id === user._id.toString() || m.email === user.email
    );
    if (!isAssigned && !isMember) {
      throw new ApiError('You are not authorised to access this project', 403);
    }
  }

  res.status(200).json({ success: true, project });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Super Admin, Admin, Project Manager) – enforced in route
export const createProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await ProjectService.createProject(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, project, message: 'Project created successfully' });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Super Admin, Admin, PM, Team Lead) – enforced in route
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const project = await ProjectService.updateProject(id, req.body);
  res.status(200).json({ success: true, project, message: 'Project updated successfully' });
});

// @desc    Delete/Archive project
// @route   DELETE /api/projects/:id
// @access  Private (Super Admin, Admin) – enforced in route
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await ProjectService.deleteProject(id);
  res.status(200).json({ success: true, message: 'Project deleted successfully' });
});
