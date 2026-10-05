import { Router } from 'express';
import { getReportsData, exportReport } from '../controllers/reportsController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types/auth';

const router = Router();

router.use(protect);

const allowedRoles: UserRole[] = ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'];

router.get('/', authorize(...allowedRoles), getReportsData);
router.get('/export', authorize(...allowedRoles), exportReport);

export default router;
