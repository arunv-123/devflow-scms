import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(authorize('Super Admin', 'Admin'), getSettings)
  .put(authorize('Super Admin', 'Admin'), updateSettings);

export default router;
