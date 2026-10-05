import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ProjectService } from '../services/projectService';
import { ActivityLogModel } from '../models/activityLogModel';
import { NotificationService } from '../services/notificationService';
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

  // Log Activity for initial tech stack
  if (project.techStack && project.techStack.length > 0) {
    try {
      await ActivityLogModel.create({
        userName: req.user?.name || 'Authenticated User',
        userRole: req.user?.role || 'Project Manager',
        userId: req.user?._id?.toString(),
        userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        action: 'Tech Stack Created',
        entity: project.name,
        entityId: project._id.toString(),
        projectId: project._id.toString(),
        projectName: project.name,
        description: `Initial tech stack created for "${project.name}": ${project.techStack.join(', ')}`,
        metadata: {
          previousTechStack: [],
          newTechStack: project.techStack,
          additions: project.techStack,
          removals: [],
        },
      });
    } catch (e) {
      console.error('Failed to log project creation activity:', e);
    }
  }

  res.status(201).json({ success: true, project, message: 'Project created successfully' });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Super Admin, Admin, PM, Team Lead) – enforced in route
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  // Fetch existing project to compare tech stack changes
  let existingProject: any = null;
  try {
    existingProject = await ProjectService.getProjectById(id);
  } catch (_) {}

  const previousTechStack: string[] = existingProject?.techStack || [];
  const project = await ProjectService.updateProject(id, req.body);

  // If project members are updated, check if any team members were added/removed and notify them
  if (req.body.members && Array.isArray(req.body.members) && existingProject) {
    const oldMemberIds = new Set<string>();
    if (Array.isArray(existingProject.members)) {
      existingProject.members.forEach((m: any) => {
        if (m.id || m._id) oldMemberIds.add((m.id || m._id).toString());
      });
    }

    const newMemberIds = new Set<string>();
    req.body.members.forEach((m: any) => {
      if (m.id || m._id) newMemberIds.add((m.id || m._id).toString());
    });

    const removedUserIds = Array.from(oldMemberIds).filter((mId) => !newMemberIds.has(mId));
    const addedUserIds = Array.from(newMemberIds).filter((mId) => !oldMemberIds.has(mId));

    for (const addedId of addedUserIds) {
      try {
        await NotificationService.notifyUserAddedToProject({
          project,
          addedUserId: addedId,
          actorUserId: req.user?._id?.toString(),
          actorName: req.user?.name,
        });
      } catch (e) {
        console.error('Failed to notify added project member:', e);
      }
    }

    for (const remId of removedUserIds) {
      try {
        await NotificationService.notifyUserRemovedFromProject({
          projectName: project.name,
          projectId: project._id.toString(),
          removedUserId: remId,
          actorName: req.user?.name,
        });
      } catch (e) {
        console.error('Failed to notify removed project member:', e);
      }
    }

    if (removedUserIds.length > 0) {
      const pIdStr = existingProject._id.toString();
      const unassignedRef = {
        id: 'unassigned',
        name: 'Unassigned',
        email: 'unassigned@devflow.io',
        role: 'Unassigned',
        avatar: '',
      };

      // Find tasks assigned to removed members
      const { Task } = await import('../models/taskModel');
      const affectedTasks = await Task.find({
        $or: [{ projectId: pIdStr }, { projectId: id }],
        'assignee.id': { $in: removedUserIds },
      });

      if (affectedTasks.length > 0) {
        await Task.updateMany(
          {
            $or: [{ projectId: pIdStr }, { projectId: id }],
            'assignee.id': { $in: removedUserIds },
          },
          {
            $set: { assignee: unassignedRef },
          }
        );

        // Log Activity for each unassigned task
        for (const t of affectedTasks) {
          try {
            await ActivityLogModel.create({
              userName: req.user?.name || 'Authenticated User',
              userRole: req.user?.role || 'Project Manager',
              userId: req.user?._id?.toString(),
              userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              action: 'Task Unassigned',
              entity: t.title,
              entityId: t._id.toString(),
              projectId: pIdStr,
              projectName: existingProject.name,
              description: `Unassigned task "${t.title}" because assigned team member (${t.assignee?.name || 'Member'}) was removed from project team`,
              metadata: {
                previousAssignee: t.assignee,
                newAssignee: unassignedRef,
                reason: 'Team member removed from project team',
              },
            });
          } catch (e) {
            console.error('Failed to log task unassignment activity:', e);
          }
        }
      }
    }
  }

  // If techStack is updated, compare & log activity
  if (req.body.techStack && Array.isArray(req.body.techStack)) {
    const newTechStack: string[] = req.body.techStack;
    
    // Check if stack actually changed
    const prevSorted = [...previousTechStack].sort().join(',');
    const newSorted = [...newTechStack].sort().join(',');
    
    if (prevSorted !== newSorted) {
      const prevLower = new Set(previousTechStack.map((t) => t.trim().toLowerCase()));
      const newLower = new Set(newTechStack.map((t) => t.trim().toLowerCase()));

      const additions = newTechStack.filter((t) => !prevLower.has(t.trim().toLowerCase()));
      const removals = previousTechStack.filter((t) => !newLower.has(t.trim().toLowerCase()));

      let descParts: string[] = [];
      if (additions.length > 0) descParts.push(`Added ${additions.join(', ')}`);
      if (removals.length > 0) descParts.push(`Removed ${removals.join(', ')}`);
      const changeDesc = descParts.length > 0 ? descParts.join(' • ') : `Updated to ${newTechStack.join(', ')}`;

      try {
        await ActivityLogModel.create({
          userName: req.user?.name || 'Authenticated User',
          userRole: req.user?.role || 'Project Manager',
          userId: req.user?._id?.toString(),
          userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          action: 'Tech Stack Updated',
          entity: project.name,
          entityId: project._id.toString(),
          projectId: project._id.toString(),
          projectName: project.name,
          description: `Tech stack updated for "${project.name}": ${changeDesc}`,
          metadata: {
            previousTechStack,
            newTechStack,
            additions,
            removals,
            reason: req.body.reason || 'Project manager updated tech stack',
          },
        });
      } catch (e) {
        console.error('Failed to log tech stack update activity:', e);
      }
    }
  }

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
