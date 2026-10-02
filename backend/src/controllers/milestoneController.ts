import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ProjectService } from '../services/projectService';
import { ApiError, asyncHandler } from '../utils/errors';

// ─── Role helpers ─────────────────────────────────────────────────────────────

const FULL_MILESTONE_ROLES = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'] as const;

// ─── MILESTONES ───────────────────────────────────────────────────────────────

/**
 * @desc   Get all milestones (optionally filtered by projectId)
 * @route  GET /api/milestones
 * @access Private – All roles
 *         • Super Admin / Admin / PM / Team Lead / Dev / Designer / QA → all (or project-scoped)
 *         • Client → only milestones for projects they are assigned to
 */
export const getMilestones = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const role = user.role;
    const projectId = req.query.projectId as string | undefined;

    let milestones = await ProjectService.getMilestones(projectId);

    if (role === 'Client') {
      // Clients can only see milestones for projects they are members of
      const assignedProjectIds = (user.assignedProjects || []).map((id) => id.toString());
      milestones = milestones.filter((m) => assignedProjectIds.includes(m.projectId));
    }

    res.status(200).json({ success: true, count: milestones.length, milestones });
  }
);

/**
 * @desc   Get single milestone by ID
 * @route  GET /api/milestones/:id
 * @access Private – All roles
 *         • Client → only if the milestone belongs to one of their assigned projects
 */
export const getMilestoneById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const role = user.role;
    const id = req.params['id'] as string;

    const milestone = await ProjectService.getMilestoneById(id);

    if (role === 'Client') {
      const assignedProjectIds = (user.assignedProjects || []).map((pid) => pid.toString());
      if (!assignedProjectIds.includes(milestone.projectId)) {
        throw new ApiError(
          'You are not authorised to view this milestone.',
          403
        );
      }
    }

    res.status(200).json({ success: true, milestone });
  }
);

/**
 * @desc   Create new milestone
 * @route  POST /api/milestones
 * @access Private – Super Admin, Admin, Project Manager, Team Lead
 */
export const createMilestone = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const role = req.user!.role;

    if (!(FULL_MILESTONE_ROLES as readonly string[]).includes(role)) {
      throw new ApiError(
        `Role '${role}' is not authorised to create milestones.`,
        403
      );
    }

    const milestone = await ProjectService.createMilestone(
      req.body,
      req.user!._id.toString()
    );
    res.status(201).json({
      success: true,
      milestone,
      message: 'Milestone created successfully',
    });
  }
);

/**
 * @desc   Update milestone
 * @route  PUT /api/milestones/:id
 * @access Private
 *         • Super Admin / Admin / PM → full update
 *         • Team Lead → can ONLY update progress and status
 *         • Developer / Designer / QA / Client → forbidden
 */
export const updateMilestone = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const role = req.user!.role;
    const id = req.params['id'] as string;

    if (role === 'Client') {
      throw new ApiError('Clients are not authorised to update milestones.', 403);
    }

    if (['Developer', 'Designer', 'QA'].includes(role)) {
      throw new ApiError(
        `Role '${role}' is not authorised to update milestones.`,
        403
      );
    }

    if (role === 'Team Lead') {
      // Team Leads can only update progress and/or status
      const ALLOWED_FIELDS_TL = ['progress', 'status'];
      const requestedKeys = Object.keys(req.body);
      const forbidden = requestedKeys.filter((k) => !ALLOWED_FIELDS_TL.includes(k));
      if (forbidden.length > 0) {
        throw new ApiError(
          `Team Leads can only update milestone progress and status. Attempted: ${forbidden.join(', ')}.`,
          403
        );
      }
    }

    const milestone = await ProjectService.updateMilestone(id, req.body);
    res.status(200).json({
      success: true,
      milestone,
      message: 'Milestone updated successfully',
    });
  }
);

/**
 * @desc   Delete milestone
 * @route  DELETE /api/milestones/:id
 * @access Private – Super Admin, Admin, Project Manager
 */
export const deleteMilestone = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const role = req.user!.role;
    const id = req.params['id'] as string;

    if (!['Super Admin', 'Admin', 'Project Manager'].includes(role)) {
      throw new ApiError(
        `Role '${role}' is not authorised to delete milestones.`,
        403
      );
    }

    await ProjectService.deleteMilestone(id);
    res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
  }
);
