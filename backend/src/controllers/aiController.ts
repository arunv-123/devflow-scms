import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';

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

    const recommendations = await aiService.getSmartTeamRecommendations(projectId, targetSkills);

    res.status(200).json({
      success: true,
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt, projectId } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({
        success: false,
        message: 'Prompt text is required',
      });
      return;
    }

    const response = await aiService.processAssistantChat(prompt, projectId);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
