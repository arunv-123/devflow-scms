import { Router } from 'express';
import {
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestoneController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All milestone routes require authentication
router.use(protect);

// RBAC is enforced inside each controller handler
router.route('/').get(getMilestones).post(createMilestone);
router.route('/:id').get(getMilestoneById).put(updateMilestone).delete(deleteMilestone);

export default router;
