import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize(
    'Super Admin',
    'Admin',
    'Project Manager',
    'Team Lead',
    'Project Coordinator',
    'Developer',
    'Designer',
    'QA'
  ),
  getDashboardData
);

export default router;
