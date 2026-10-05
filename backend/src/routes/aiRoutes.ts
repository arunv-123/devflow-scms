import { Router } from 'express';
import {
  getProjectHealth,
  runProjectHealthScan,
  getTeamRecommendations,
  getTaskAssigneeRecommendations,
  handleAssistantChat,
  confirmSubtasks,
  autoLinkMilestones,
  confirmMilestoneLinks,
} from '../controllers/aiController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all AI routes with JWT auth
router.use(protect);

router.get('/project-intelligence', getProjectHealth);
router.post('/project-intelligence/scan', authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'), runProjectHealthScan);
router.get('/team-recommendations', authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'), getTeamRecommendations);
router.get('/task-recommendations', authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'), getTaskAssigneeRecommendations);
router.post('/assistant', handleAssistantChat);
router.post('/confirm-subtasks', confirmSubtasks);
router.post('/auto-link-milestones', authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'), autoLinkMilestones);
router.post('/confirm-milestone-links', authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'), confirmMilestoneLinks);

export default router;
