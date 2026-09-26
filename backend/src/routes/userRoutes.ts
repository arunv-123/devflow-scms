import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(getUsers)
  .post(authorize('Super Admin', 'Admin', 'Project Manager'), createUser);

router
  .route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(authorize('Super Admin', 'Admin'), deleteUser);

export default router;
