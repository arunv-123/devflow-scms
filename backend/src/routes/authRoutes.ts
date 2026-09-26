import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  adminOnlyTest,
} from '../controllers/authController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', protect, authorize('Super Admin', 'Admin', 'Project Manager'), register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/admin-only', protect, authorize('Admin', 'Super Admin'), adminOnlyTest);

export default router;
