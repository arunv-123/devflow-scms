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
  .get(authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Developer', 'Designer', 'QA', 'Project Coordinator'), getUsers)
  .post(authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'), createUser);

router.post('/invite', authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'), inviteUser);
router.post('/:id/resend-invitation', authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'), resendInvitation);
router.post('/:id/cancel-invitation', authorize('Super Admin', 'Admin'), cancelInvitation);

router
  .route('/:id')
  .get(authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Developer', 'Designer', 'QA', 'Project Coordinator'), getUserById)
  .put(updateUser)
  .delete(authorize('Super Admin', 'Admin'), deleteUser);

export default router;
