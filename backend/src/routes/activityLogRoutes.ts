import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getActivityLogs);

export default router;
