import { Router } from 'express';
import { getReportsData } from '../controllers/reportsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getReportsData);

export default router;
