import { Router } from 'express';
import { getReportsData } from '../controllers/reportsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead'), getReportsData);

export default router;
