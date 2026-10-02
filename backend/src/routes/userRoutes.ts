import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import {
  inviteUser,
  resendInvitation,
  cancelInvitation,
} from '../controllers/invitationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(getUsers)
  .post(authorize('Super Admin', 'Admin', 'Project Manager'), createUser);

router.post('/invite', authorize('Super Admin', 'Admin', 'Project Manager'), inviteUser);
router.post('/:id/resend-invitation', authorize('Super Admin', 'Admin', 'Project Manager'), resendInvitation);
router.post('/:id/cancel-invitation', authorize('Super Admin', 'Admin'), cancelInvitation);

router
  .route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(authorize('Super Admin', 'Admin'), deleteUser);

export default router;
