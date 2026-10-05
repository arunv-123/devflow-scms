import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';
import { AuthRequest } from '../types/auth';

/**
 * GET /api/ai/project-intelligence
 * Get project health scores & diagnostic insights
 */
export const getProjectHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const report = await aiService.analyzeProjectHealth(projectId);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/project-intelligence/scan
 * Trigger a real-time recalculation of project health scores
 */
export const runProjectHealthScan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.body?.projectId as string | undefined;
    const report = await aiService.analyzeProjectHealth(projectId);

    res.status(200).json({
      success: true,
      message: 'Project health real-time scan completed successfully.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/team-recommendations
 * Get algorithmic team recommendations for project/task
 */
export const getTeamRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const skillsParam = req.query.skills as string | undefined;
    const targetSkills = skillsParam ? skillsParam.split(',').map((s) => s.trim()) : undefined;

    const result = await aiService.getSmartTeamRecommendations(projectId, targetSkills);

    res.status(200).json({
      success: true,
      data: result,
      totalRequiredCount: result.totalRequiredCount,
      totalCurrentCount: result.totalCurrentCount,
      roleCoverage: result.roleCoverage,
      roleGroupedRecommendations: result.roleGroupedRecommendations,
      primaryRecommendations: result.primaryRecommendations,
      alternativeCandidates: result.alternativeCandidates,
      existingMembers: result.existingMembers,
      requirements: result.requirements,
      recommendations: result.primaryRecommendations,
      existingMembersCount: result.totalCurrentCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/task-recommendations
 * Get AI recommended assignees exclusively from project team members
 */
export const getTaskAssigneeRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.query.projectId as string;
    const skillsParam = req.query.skills as string | undefined;
    const targetSkills = skillsParam ? skillsParam.split(',').map((s) => s.trim()) : undefined;

    if (!projectId) {
      res.status(200).json({
        success: true,
        data: [],
        recommendations: [],
      });
      return;
    }

    const recommendations = await aiService.getTaskAssigneeRecommendations(projectId, targetSkills);

    res.status(200).json({
      success: true,
      data: recommendations,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/assistant
 * Conversational AI Project Assistant endpoint
 */
export const handleAssistantChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt, projectId, action, taskId, messages } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const response = await aiService.processAssistantChat({
      prompt: prompt || '',
      projectId,
      action,
      taskId,
      messages: Array.isArray(messages) ? messages : undefined,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/confirm-subtasks
 * Save developer-confirmed AI task subtasks
 */
export const confirmSubtasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId, subtasks } = req.body;
    if (!taskId || !Array.isArray(subtasks)) {
      res.status(400).json({
        success: false,
        message: 'taskId and subtasks array are required',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const updatedTask = await aiService.confirmSubtasks(taskId, subtasks, req.user);

    res.status(200).json({
      success: true,
      message: 'Task subtasks confirmed and saved successfully.',
      data: updatedTask,
    });
  } catch (error: any) {
    res.status(error.message?.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to confirm subtasks.',
    });
  }
};

/**
 * POST /api/ai/auto-link-milestones
 * Trigger semantic AI matching for unlinked existing tasks
 */
export const autoLinkMilestones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = (req.body?.projectId || req.query.projectId) as string | undefined;
    const result = await aiService.autoLinkTasksToMilestones(projectId);

    res.status(200).json({
      success: true,
      message: 'AI automatic milestone linking complete.',
      data: result,
      summary: result.summary,
      recommendations: result.recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/confirm-milestone-links
 * Save coordinator-approved AI task milestone associations
 */
export const confirmMilestoneLinks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      res.status(400).json({
        success: false,
        message: 'Updates list array is required',
      });
      return;
    }

    const result = await aiService.confirmTaskMilestoneLinks(updates);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.updatedCount} task milestone links.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

