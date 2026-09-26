import { Router } from 'express';
import {
  getProjectHealth,
  runProjectHealthScan,
  getTeamRecommendations,
  handleAssistantChat,
} from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Protect all AI routes with JWT auth
router.use(protect);

router.get('/project-intelligence', getProjectHealth);
router.post('/project-intelligence/scan', runProjectHealthScan);
router.get('/team-recommendations', getTeamRecommendations);
router.post('/assistant', handleAssistantChat);

export default router;
